import {Client} from 'node-rest-client';
import BaseConnector from './BaseConnector';

let baseStatements = {
  "allSistemas":"MATCH (v:`Sistema`) RETURN v ORDER BY v. `Identificador` SKIP { s } LIMIT { l }",
  "oneSistema":"MATCH (v:`Sistema`) WHERE (lower(v.`Identificador`) CONTAINS '_SISTEMA_' OR lower(v.`Código`) CONTAINS '_SISTEMA_') RETURN v ORDER BY v.`Identificador` SKIP { s } LIMIT { l }",
  "allSistemaDBUsers":"MATCH (v:`Login`) WHERE (lower(v.`Identificador`) CONTAINS '_SISTEMA_' OR lower(v.`Código`) CONTAINS '_SISTEMA_') RETURN v ORDER BY v.`Identificador` SKIP { s } LIMIT { l }",
  "allTablesReadBySistema":"MATCH (vFrom)-[r]->(vTo) WHERE (id(vFrom) IN [_CODIGOS_] OR id(vTo) IN [_CODIGOS_]) AND type(r) = 'é uma Tabela com leitura pelo Login' RETURN id(vFrom), vFrom.`Identificador`, type(r), id(vTo), vTo.`Identificador` ORDER BY r.type, vFrom.`Identificador`, vTo.`Identificador` SKIP { s } LIMIT { l }",
  "oneTabela":"MATCH (v:`Tabela`) WHERE (lower(v.`Identificador`) = '_TABELA_' OR lower(v.`Código`) = '_TABELA_' OR lower(v.`Nome`) = '_TABELA_') RETURN v"
};

/**
 * Connector to Mapa da Informacao system
 * @type {class}
 */
class MapaInformacaoConnector extends BaseConnector{
  constructor(baseURL, authentication) {
    super();
    this.authentication = authentication;
    this.baseURL = baseURL;
    this._registerMethods(this.baseURL, {'query_POST':'/db/data/transaction/commit'});
  }

  /**
   * base function to parse results from Neo4J
   * @param  {object} data          Neo4J response data
   * @param  {function} parseFunction custom parse function
   * @return {Array[object]}               array of parsed results
   */
  _parseResults(data, parseFunction) {
    let results = data.results[0].data;
    let parsedResults = [];
    results.map((r)=>{
      if (parseFunction) parsedResults = parseFunction(r,parsedResults);
      else {
        if (!r.rest || r.rest.length != 1) return;
        let rData = r.rest[0].data;
        rData['id'] = r.rest[0].metadata.id;
        parsedResults.push(rData);
        return;
      }
    });
    return parsedResults;
  }

  /**
   * list all sistemas of Mapa da Informação
   * @return {Promise} promise to requested method results
   */
  getAllSistemas() {
    let statement = baseStatements['allSistemas'];
    return this._fetchResults('query', {}, statement, {}, this.authentication, [(data) => { return (data.results && data.results.length == 1 && data.results[0].data && data.results[0].data.length > 0); }]);
  }

  /**
   * get just one sistema from Mapa da Informação based on Sistema name
   * @param  {string} sistema Name of sistema
   * @return {Promise}         promise to requested method results
   */
  getSistema(sistema) {
    if (!sistema || sistema.length == 0) return new Promise( (resolve,reject) => reject('Invalid argument') );
    let lwSistema = sistema.toLowerCase();
    let statement = baseStatements['oneSistema'];
    return this._fetchResults('query',{},statement,{'_SISTEMA_':lwSistema},this.authentication,[(data) => { return (data.results && data.results.length == 1 && data.results[0].data && data.results[0].data.length > 0); }]);
  }

  /**
   * get all database users of a sistema
   * @param  {string} sistema Name of sistema
   * @return {Promise}         primise to requested method results
   */
  getAllSistemaDbUsers(sistema) {
    if (!sistema || sistema.length == 0) return new Promise( (resolve,reject) => reject('Invalid argument') );
    let lwSistema = sistema.toLowerCase();
    let statement = baseStatements['allSistemaDBUsers'];
    return this._fetchResults('query',{}, statement, {'_SISTEMA_': lwSistema}, this.authentication, [(data) => { return (data.results && data.results.length == 1 && data.results[0].data && data.results[0].data.length > 0); }]);
  }

  /**
   * get a list of tables with READ access from a list of users
   * @param  {Array[string]} users list of users
   * @return {Promise}         promise of requested method results
   */
  getTablesReadByUser(users) {
    if (!users || users.length == 0) return new Promise( (resolve,reject) => reject('Invalid argument') );
    let statement = baseStatements['allTablesReadBySistema'];
    return this._fetchResults('query',{}, statement, {'_CODIGOS_': users}, this.authentication, [(data) => { return (data.results && data.results.length == 1 && data.results[0].data && data.results[0].data.length > 0); }], (r,parsedResults) => {
      if (r.rest && r.rest.length == 5) {
        let rData = {
          fromId:r.rest[0],
          fromIdentificador:r.rest[1],
          verb:r.rest[2],
          toId:r.rest[3],
          toIdentificador:r.rest[4]
        }
        parsedResults.push(rData);
      }
      return parsedResults;
    });
  }

  /**
   * get one tabela from name
   * @param  {string} tabela name of tabela
   * @return {Promise}        promise for requested results
   */
  getTabela(tabela) {
    if (!tabela || tabela.length == 0) return new Promise( (resolve,reject) => reject('Invalid argument') );
    let lwTabela = tabela.replace(/ /g,'_').toLowerCase();
    let statement = baseStatements['oneTabela'];
    return this._fetchResults('query',{}, statement, {'_TABELA_': lwTabela}, this.authentication, [(data) => { return (data.results && data.results.length == 1 && data.results[0].data && data.results[0].data.length > 0); }]);
  }
}

export default MapaInformacaoConnector;
