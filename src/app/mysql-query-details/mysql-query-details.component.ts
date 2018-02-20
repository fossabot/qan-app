import {Component, OnInit} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {Instance, InstanceService} from '../core/instance.service';
import {CoreComponent, QueryParams} from '../core/core.component';
import {MySQLQueryDetailsService, QueryDetails, ServerSummary} from './mysql-query-details.service';
import * as hljs from 'highlight.js';
import * as vkbeautify from 'vkbeautify';
import * as moment from 'moment';

@Component({
  moduleId: module.id,
  selector: 'app-query-details',
  templateUrl: './mysql-query-details.component.html',
  styleUrls: ['./mysql-query-details.component.scss']
})
export class MySQLQueryDetailsComponent extends CoreComponent implements OnInit {

  protected queryID: string;
  protected queryDetails: QueryDetails;
  protected tableInfo;
  public createTable: string;
  public fingerprint: string;
  public queryExample: string;
  protected classicExplain;
  protected jsonExplain;
  protected dbName: string;
  public dbTblNames: string;
  protected newDBTblNames: string;
  isSummary: boolean;
  isLoading: boolean;
  isExplainLoading: boolean;
  isTableInfoLoading: boolean;
  firstSeen: string;
  lastSeen: string;

  createTableError: string;
  statusTableError: string;
  indexTableError: string;

  jsonExplainError: string;
  classicExplainError: string;

  constructor(protected route: ActivatedRoute, protected router: Router,
              protected instanceService: InstanceService, protected queryDetailsService: MySQLQueryDetailsService) {
    super(route, router, instanceService);
  }

  ngOnInit() {
    this.queryParams = this.route.snapshot.queryParams as QueryParams;
    this.parseParams();
    this.onChangeParams(this.queryParams);
  }

  onChangeParams(params) {
    if (['TOTAL', undefined].indexOf(this.queryParams.queryID) !== -1) {
      this.isSummary = true;
      this.getServerSummary(this.dbServer.UUID, this.fromUTCDate, this.toUTCDate);
    } else {
      this.isSummary = false;
      this.getQueryDetails(this.dbServer.UUID, this.queryParams.queryID, this.fromUTCDate, this.toUTCDate);
    }
  }

  async getQueryDetails(dbServerUUID, queryID, from, to: string) {
    this.isLoading = true;
    this.dbName = this.dbTblNames = '';
    this.queryExample = '';
    try {
      this.queryDetails = await this.queryDetailsService.getQueryDetails(dbServerUUID, queryID, from, to)
      this.firstSeen = moment(this.queryDetails.Query.FirstSeen).calendar(null, {sameElse: 'lll'});
      this.lastSeen = moment(this.queryDetails.Query.LastSeen).calendar(null, {sameElse: 'lll'});

      this.fingerprint = hljs.highlight('sql', vkbeautify.sql(this.queryDetails.Query.Fingerprint)).value;
      if (this.queryDetails !== null && this.queryDetails.Example !== null && this.queryDetails.Example.Query !== '') {
        this.queryExample = hljs.highlight('sql', vkbeautify.sql(this.queryDetails.Example.Query)).value;
      }
      this.isLoading = false;
      if (this.queryExample) {
        this.getExplain();
      }
      this.getTableInfo()
    } catch (err) {
      console.error(err);
    }
  }

  async getServerSummary(dbServerUUID: string, from: string, to: string) {
    this.dbName = this.dbTblNames = '';
    try {
      this.queryDetails = await this.queryDetailsService.getSummary(dbServerUUID, from, to) as QueryDetails;
    } catch (err) {
      console.error(err);
    }
  }

  async getExplain() {
    this.isExplainLoading = true;
    const agentUUID = this.dbServer.Agent.UUID;
    const dbServerUUID = this.dbServer.UUID;
    this.classicExplainError = '';
    this.jsonExplainError = '';
    if (this.dbName === '') {
      this.dbName = this.getDBName();
    }

    const query = this.queryDetails.Example.Query;
    const size = this.queryDetails.Example.Size;
    if (size > 0 && size > query.length) {
        this.classicExplainError = this.jsonExplainError = 'Cannot explain truncated query. This query was '+size+' bytes long and was truncated to maximum size of '+query.length+' bytes.';
        this.isExplainLoading = false;
        return
    }

    try {
      let data = await this.queryDetailsService.getExplain(agentUUID, dbServerUUID, this.dbName, query);
      if (data.hasOwnProperty('Error') && data['Error'] !== '') {
        throw new Error(data['Error']);
      }
      data = JSON.parse(atob(data.Data));
      this.classicExplain = data.Classic;

      try {
        this.jsonExplain = JSON.parse(data.JSON);
      } catch (err) {
        this.jsonExplainError = err.message;
      }
    } catch (err) {
      this.classicExplainError = this.jsonExplainError = 'This type of query is not supported for EXPLAIN';
    }

    this.isExplainLoading = false;
  }

  getTableInfo() {
    this.isTableInfoLoading = true;
    const agentUUID = this.dbServer.Agent.UUID;
    const dbServerUUID = this.dbServer.UUID;
    this.statusTableError = '';
    this.indexTableError = '';
    this.createTableError = '';
    let dbName, tblName: string;
    if (this.dbTblNames === '') {
      dbName = this.getDBName();
      tblName = this.getTableName();
      this.dbTblNames = `\`${dbName}\`.\`${tblName}\``;
    } else {
      const parts = this.dbTblNames.split('.');
      dbName = parts[0];
      tblName = parts[1];
    }

    this.queryDetailsService.getTableInfo(agentUUID, dbServerUUID, dbName, tblName)
      .then(data => {
        const info = data[`${dbName}.${tblName}`];
        if (info.hasOwnProperty('Errors') && info['Errors'].length > 0) {
          throw info['Errors'];
        }
        this.tableInfo = info;
        this.createTable = hljs.highlight('sql', this.tableInfo.Create).value;
      })
      .catch(errors => {
        for (const err of errors) {
          if (err.startsWith('SHOW TABLE STATUS')) {
            this.statusTableError = err;
          }
          if (err.startsWith('SHOW INDEX FROM')) {
            this.indexTableError = err;
          }
          if (err.startsWith('SHOW CREATE TABLE')) {
            this.createTableError = err;
          }
        }

      })
      .then(() => this.isTableInfoLoading = false);
  }

  selectTableInfo(dbName: string, tblName: string) {
    this.isTableInfoLoading = true;
    this.statusTableError = '';
    this.indexTableError = '';
    this.createTableError = '';
    const agentUUID = this.dbServer.Agent.UUID;
    const dbServerUUID = this.dbServer.UUID;
    this.dbTblNames = `\`${dbName}\`.\`${tblName}\``;


    this.queryDetailsService.getTableInfo(agentUUID, dbServerUUID, dbName, tblName)
      .then(data => {
        const info = data[`${dbName}.${tblName}`];
        if (info.hasOwnProperty('Errors') && info['Errors'].length > 0) {
          throw info['Errors'];
        }
        this.tableInfo = info;
        this.createTable = hljs.highlight('sql', this.tableInfo.Create).value;
      })
      .catch(errors => {
        for (const err of errors) {
          if (err.startsWith('SHOW TABLE STATUS')) {
            this.statusTableError = err;
          }
          if (err.startsWith('SHOW INDEX FROM')) {
            this.indexTableError = err;
          }
          if (err.startsWith('SHOW CREATE TABLE')) {
            this.createTableError = err;
          }
        }

      })
      .then(() => this.isTableInfoLoading = false);
  }

  addDBTable() {
    if (this.newDBTblNames.length > 6) {
      const part = this.newDBTblNames.split('.');
      const db = part[0].replace(/`/g, '');
      const tbl = part[1].replace(/`/g, '');
      if (this.queryDetails.Query.Tables === null) {
        this.queryDetails.Query.Tables = [];
      }
      this.queryDetails.Query.Tables.push({Db: db, Table: tbl});
      this.queryDetailsService.updateTables(this.queryDetails.Query.Id, this.queryDetails.Query.Tables);
      this.dbTblNames = this.newDBTblNames;
      this.getTableInfo();
      this.newDBTblNames = '';
    }
    return false;
  }

  removeDBTable(dbTableItem) {
    const len = this.queryDetails.Query.Tables.length;
    for (let i = 0; i < len; i++) {
      try {
        if (this.queryDetails.Query.Tables[i].Db === dbTableItem.Db
          && this.queryDetails.Query.Tables[i].Table === dbTableItem.Table) {
          this.queryDetails.Query.Tables.splice(i, 1);
        }
      } catch (e) {
        console.error(e);
      }
    }
    this.queryDetailsService.updateTables(this.queryDetails.Query.Id, this.queryDetails.Query.Tables);
  }

  isSelectedDbTbl(item): boolean {
    return `\`${item.Db}\`.\`${item.Table}\`` === this.dbTblNames;
  }

  getTableName(): string {
    if (this.queryDetails.hasOwnProperty('Query')
      && this.queryDetails.Query.hasOwnProperty('Tables')
      && this.queryDetails.Query.Tables !== null
      && this.queryDetails.Query.Tables.length > 0) {
      return this.queryDetails.Query.Tables[0].Table;
    }
    return '';
  }

  private getDBName(): string {
    if (this.queryDetails.Example.Db !== '') {
      return this.queryDetails.Example.Db;
    } else if (this.queryDetails.hasOwnProperty('Query')
      && this.queryDetails.Query.hasOwnProperty('Tables')
      && this.queryDetails.Query.Tables !== null
      && this.queryDetails.Query.Tables.length > 0) {
      return this.queryDetails.Query.Tables[0].Db;
    }
    return '';
  }
}
