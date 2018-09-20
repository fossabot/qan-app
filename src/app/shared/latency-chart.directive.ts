import { Directive, Input, HostBinding } from '@angular/core';
import { ElementRef } from '@angular/core';

import { select } from 'd3-selection';
import { scaleLog } from 'd3-scale';

import { HumanizePipe } from './humanize.pipe';

@Directive({
  selector: '[appLatencyChart]'
})
export class LatencyChartDirective {

  @HostBinding('attr.data-tooltip')
  @Input() dataTooltip: string;
  @Input() measurement = 'time';
  @Input() metricPrefix = '';

  @Input() set appLatencyChart(data: {}) {
    if (data !== null) {
      this.drawChart(data);
    } /* istanbul ignore else*/
  }

  constructor(
    public elementRef: ElementRef,
  ) { }

  drawChart(data: {}) {
    const chart = select(this.elementRef.nativeElement);
    chart.selectAll('*').remove();
    const svg: any = chart.append('svg')
      .attr('height', '20')
      .attr('width', '100')
      .attr('class', 'scaling-svg')
      .attr('viewBox', '0 0 100 20');

    const width = Math.floor(svg.node().getBoundingClientRect().width);
    svg.attr('width', width).attr('viewBox', '0 0 ' + width + ' 20');

    const x = scaleLog()
      .domain([0.00001, 10000])
      .range([2, width - 2])
      .clamp(true)
      .nice();

    let min = 0;
    let max = 0;
    let avg = 0;
    let p95 = 0;

    if (!!this.metricPrefix) {
      /* istanbul ignore next*/ min = `${this.metricPrefix}_min` in data ? data[`${this.metricPrefix}_min`] : 0;
      /* istanbul ignore next*/ max = `${this.metricPrefix}_max` in data ? data[`${this.metricPrefix}_max`] : 0;
      /* istanbul ignore next*/ avg = `${this.metricPrefix}_avg` in data ? data[`${this.metricPrefix}_avg`] : 0;
      /* istanbul ignore next*/ p95 = `${this.metricPrefix}_p95` in data ? data[`${this.metricPrefix}_p95`] : 0;
    } else {
      /* istanbul ignore next*/ min = 'Min' in data ? data['Min'] : 0;
      /* istanbul ignore next*/ max = 'Max' in data ? data['Max'] : 0;
      /* istanbul ignore next*/ avg = 'Avg' in data ? data['Avg'] : 0;
      /* istanbul ignore next*/ p95 = 'P95' in data ? data['P95'] : 0;
    }

    const humanize = new HumanizePipe();
    let tooltip = ` ⌜ Min: ${humanize.transform(min, this.measurement)}
 ⌟ Max: ${humanize.transform(max, this.measurement)}
 ◦ Avg: ${humanize.transform(avg, this.measurement)}`;

    if (p95 !== 0 && p95 !== null ) {
      tooltip += `
 • 95%: ${humanize.transform(p95, this.measurement)}`;
    }
    this.dataTooltip = tooltip;

    const g = svg.append('g');

    // hrAxes
    g.append('line')
      .attr('class', 'latency-chart-x')
      .attr('x1', '0')
      .attr('stroke-dasharray', '1, 1')
      .attr('y1', '13px')
      .attr('x2', width)
      .attr('y2', '13px');

    // hrLine
    g.append('line')
      .attr('class', 'latency-chart-line')
      .attr('x1', x(min) + '')
      .attr('y1', '13px')
      .attr('x2', x(max) + '')
      .attr('y2', '13px');

    // minMark
    g.append('line')
      .attr('class', 'latency-chart-min')
      .attr('x1', x(min) + '')
      .attr('y1', '13px')
      .attr('x2', x(min) + '')
      .attr('y2', '19px');

    // maxMark
    g.append('line')
      .attr('class', 'latency-chart-max')
      .attr('x1', x(max) + '')
      .attr('y1', '8px')
      .attr('x2', x(max) + '')
      .attr('y2', '13px');

    // avgMark
    g.append('circle')
      .attr('class', 'latency-chart-avg')
      .attr('r', 3)
      .attr('cx', x(avg) + '')
      .attr('cy', '13px');

    // p95Mark
    if (p95 > 0) {
      g.append('circle')
        .attr('class', 'latency-chart-p95')
        .attr('r', 2)
        .attr('cx', x(p95) + '')
        .attr('cy', '13px');
    }
  }
}
