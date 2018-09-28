import {TestBed, inject, fakeAsync, tick} from '@angular/core/testing';

import {InstanceService} from './instance.service';
import 'rxjs/add/operator/toPromise';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {BaseRequestOptions, Http, HttpModule, ResponseOptions} from '@angular/http';
import {MockBackend} from '@angular/http/testing';

describe('InstanceService', () => {
  let service: InstanceService;
  let backend: MockBackend;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpModule],
      providers: [
        MockBackend,
        BaseRequestOptions,
        {
          provide: Http,
          useFactory: (backend, defaultOptions) => new Http(backend, defaultOptions),
          deps: [MockBackend, BaseRequestOptions]
        },
        InstanceService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });
    backend = TestBed.get(MockBackend);
    service = TestBed.get(InstanceService);
  });

  it('should be empty array if response data is undefined', () => {
    expect(service).toBeTruthy();
  });

  it('should be created', fakeAsync(() => {
    const dataResponse = undefined;

    backend.connections.subscribe(connection => {
      connection.mockRespond(dataResponse);
    });

    service.getDBServers();
    tick();
    expect(service.dbServers).toEqual([]);
  }));

  it('should create dbServer if response data is valid', fakeAsync(() => {
    const dataResponse = {
      _body: '[' +
      '{"Subsystem":"tos","ParentUUID":"","Id":0,"UUID":"b7ea960bd91b45706ca3e1636467bbf0","Name":"9b49105d096a","DSN":"","Distro":"",' +
      '"Version":"","Created":"2018-09-26T08:15:55Z","Deleted":"0001-01-01T00:00:00Z"},' +
      '{"Subsystem":"agent","ParentUUID":"b7ea960bd91b45706ca3e1636467bbf0","Id":0,"UUID":"92f18c80631047f0554bf7d3360c1b20",' +
      '"Name":"9b49105d096a","DSN":"","Distro":"","Version":"1.0.5","Created":"2018-09-26T08:15:55Z","Deleted":"0001-01-01T00:00:00Z"},' +
      '{"Subsystem":"mysql","ParentUUID":"b7ea960bd91b45706ca3e1636467bbf0","Id":0,"UUID":"a7725644598849416ef6aa1272373452",' +
      '"Name":"MySQL57","DSN":"root:***@tcp(localhost:3306)","Distro":"MySQL Community Server - GPL","Version":"8.0.12",' +
      '"Created":"2018-09-26T08:15:55Z","Deleted":"1970-01-01T00:00:01Z"},' +
      '{"Subsystem":"os","ParentUUID":"","Id":0,"UUID":"8a8de2b97d9344e4624e355c4010926a","Name":"pmm-server","DSN":"","Distro":"",' +
      '"Version":"","Created":"2018-09-26T09:24:38Z","Deleted":"0001-01-01T00:00:00Z"},' +
      '{"Subsystem":"agent","ParentUUID":"8a8de2b97d9344e4624e355c4010926a","Id":0,"UUID":"6cd397a237d6459d66ab298d048d9be7",' +
      '"Name":"pmm-server","DSN":"","Distro":"","Version":"1.0.5","Created":"2018-09-26T09:24:38Z","Deleted":"0001-01-01T00:00:00Z"},' +
      '{"Subsystem":"mysql","ParentUUID":"8a8de2b97d9344e4624e355c4010926a","Id":0,"UUID":"650029f8803c42577d680e5b68584ee2",' +
      '"Name":"rds-aurora1","DSN":"xusKduray66L3B8E:***@tcp(rds-aurora1.cg8slbmxcsve.us-east-1.rds.amazonaws.com:3306)",' +
      '"Distro":"MySQL Community Server (GPL)","Version":"5.6.10","Created":"2018-09-26T09:24:38Z","Deleted":"1970-01-01T00:00:01Z"},' +
      '{"Subsystem":"mongo","ParentUUID":"8a8de2b97d9344e4624e355c4010926a","Id":0,"UUID":"53ceed9a3449448755f3fa6c217cddd5",' +
      '"Name":"rds-aurora1","DSN":"xusKduray66L3B8E:***@tcp(rds-aurora1.cg8slbmxcsve.us-east-1.rds.amazonaws.com:3306)","Distro":"",' +
      '"Version":"5.6.10a","Created":"2018-09-26T17:48:05Z","Deleted":"0001-01-01T00:00:00Z"},' +
      '{"Subsystem":"mysql","ParentUUID":"8a8de2b97d9344e4624e355c4010926a","Id":0,"UUID":"80c1cc57399c4f4f76bf48304881d557",' +
      '"Name":"rds-mysql56","DSN":"xusKduray66L3B8E:***@tcp(rds-mysql56.cg8slbmxcsve.us-east-1.rds.amazonaws.com:3306)",' +
      '"Distro":"MySQL Community Server (GPL)","Version":"5.6.37","Created":"2018-09-26T17:47:15Z","Deleted":"1970-01-01T00:00:01Z"},' +
      '{"Subsystem":"mysql","ParentUUID":"8a8de2b97d9344e4624e355c4010926a","Id":0,"UUID":"2201a955eae4436968cd57dc97d26ef4",' +
      '"Name":"rds-mysql57","DSN":"xusKduray66L3B8E:***@tcp(rds-mysql57.cg8slbmxcsve.us-east-1.rds.amazonaws.com:3306)",' +
      '"Distro":"MySQL Community Server (GPL)","Version":"5.7.19","Created":"2018-09-26T17:47:49Z","Deleted":"1970-01-01T00:00:01Z"}' +
      ']', 'status': 200,
      'ok': true,
      'statusText': 'OK',
      'headers': {
        'pragma': ['no-cache'],
        'date': ['Fri', ' 28 Sep 2018 18:35:13 GMT'],
        'x-content-type-options': ['nosniff'],
        'server': ['nginx'],
        'connection': ['keep-alive'],
        'x-frame-options': ['DENY'],
        'access-control-allow-methods': ['GET', 'PUT', 'POST', 'DELETE'],
        'content-type': ['application/json; charset=utf-8'],
        'access-control-allow-origin': ['*'],
        'cache-control': ['no-store'],
        'transfer-encoding': ['chunked'],
        'strict-transport-security': ['max-age=63072000; includeSubDomains'],
        'access-control-allow-headers': ['Content-Type', 'Authorization'],
        'x-xss-protection': ['1; mode=block']
      },
      'type': 2,
      'url': 'http://localhost/qan-api/instances?deleted=no',
      json: () => {
        return JSON.parse(dataResponse._body)
      }
    };

    backend.connections.subscribe(connection => {
      connection.mockRespond(dataResponse);
    });

    service.getDBServers();
    tick();
    expect(service.dbServers).toBeTruthy();
  }));
});
