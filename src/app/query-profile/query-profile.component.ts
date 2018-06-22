import { CoreComponent, QueryParams, QanError } from '../core/core.component';
import { Component } from '@angular/core';
import { Instance, InstanceService } from '../core/instance.service';
import { QueryProfileService } from './query-profile.service';
import { Router, ActivatedRoute } from '@angular/router';
import * as moment from 'moment';
import { MomentFormatPipe } from '../shared/moment-format.pipe';

const queryProfileError = 'No data. Please check pmm-client and database configurations on selected instance.';

@Component({
    moduleId: module.id,
    templateUrl: 'query-profile.component.html',
    styleUrls: ['./query-profile.component.scss'],
})
export class QueryProfileComponent extends CoreComponent {

    public queryProfile: Array<{}>;
    public profileTotal;
    public offset: number;
    public totalAmountOfQueries: number;
    public leftInDbQueries: number;
    public searchValue: string;
    public fromDate: string;
    public toDate: string;
    public isLoading: boolean;
    public noQueryError: string;

    constructor(protected route: ActivatedRoute, protected router: Router,
        protected instanceService: InstanceService, protected queryProfileService: QueryProfileService) {
        super(route, router, instanceService);
    }

    onChangeParams(params) {
        // checks changing tz
        const momentFormatPipe = new MomentFormatPipe();
        this.fromDate = momentFormatPipe.transform(this.from, 'llll');
        this.toDate = momentFormatPipe.transform(this.to, 'llll');
        // only if host, from and to are diffrent from prev router - load queries.
        if (!this.previousQueryParams ||
            this.previousQueryParams['var-host'] !== this.queryParams['var-host'] ||
            this.previousQueryParams.from !== this.queryParams.from ||
            this.previousQueryParams.to !== this.queryParams.to ||
            this.previousQueryParams.search !== this.queryParams.search ||
            this.previousQueryParams.tz !== this.queryParams.tz) {
            this.loadQueries();
        }
    }

    public async loadQueries() {
        this.isLoading = true;

        // clear after error
        this.noQueryError = '';
        this.totalAmountOfQueries = this.leftInDbQueries = 0;
        this.queryProfile = [];

        const search = this.queryParams.search;
        this.offset = 0;
        try {
            const data = await this.queryProfileService
                .getQueryProfile(this.dbServer.UUID, this.fromUTCDate, this.toUTCDate, this.offset, search);
            if (data.hasOwnProperty('Error') && data['Error'] !== '') {
                throw new QanError('Queries are not availible.');
            }
            this.totalAmountOfQueries = data['TotalQueries'];
            if (this.totalAmountOfQueries > 0) {
                this.queryProfile = data['Query'];
                this.leftInDbQueries = this.totalAmountOfQueries - (this.queryProfile.length - 1);
                this.profileTotal = this.queryProfile[0];
            }
        } catch (err) {
            this.noQueryError = err.name === QanError.errType ? err.message : queryProfileError;
        } finally {
            this.isLoading = false;
        }
    }

    public async loadMoreQueries() {
        this.isLoading = true;
        const dbServerUUID = this.dbServer.UUID;
        this.offset = this.offset + 10;
        const data = await this.queryProfileService
            .getQueryProfile(dbServerUUID, this.fromUTCDate, this.toUTCDate, this.offset);

        const _ = data['Query'].shift();
        for (const q of data['Query']) {
            this.queryProfile.push(q);
        }
        this.leftInDbQueries = this.totalAmountOfQueries - (this.queryProfile.length - 1);
        this.isLoading = false;
    }

    composeQueryParamsForGrid(queryID: string | null): QueryParams {
        const queryParams: QueryParams = Object.assign({}, this.queryParams);
        queryParams.queryID = queryID || 'TOTAL';
        return queryParams;
    }

    search() {
        const params: QueryParams = Object.assign({}, this.queryParams);
        if (!!this.searchValue) {
            params.search = this.searchValue;
        } else {
            delete params.search;
        }
        delete params.queryID;
        this.router.navigate(['profile'], { queryParams: params });
    }
}
