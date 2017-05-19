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
   * prepara data payload specific for Neo4J queries
   * @param  {string} statement    base query on Neo4J
   * @param  {object} substtutions Key/Value substtutions to be applyed on statement
   * @return {object}              payload object
   */
  _getDataQueryArguments(statement, substtutions) {
    let queryStatement = statement;
    if (substtutions) {
      for (let key in substtutions) {
        let regex = new RegExp(key,'g');
        queryStatement = queryStatement.replace(regex,substtutions[key]);
      }
    }
    let payload = {
      statements:[
        {
          statement:queryStatement,
          parameters:{s:0,l:10000},
          resultDataContents:["REST"]
        }
      ]
    };
    return payload;
  }

  /**
   * list all sistemas of Mapa da Informação
   * @return {Promise} promise to requested method results
   */
  getAllSistemas() {
    return new Promise( (resolve,reject) => {
      let statement = baseStatements['allSistemas'];
      let payload = this._getDataQueryArguments(statement, {});
      this._fetchResults({action:'query', payload:payload, authentication:this.authentication, validation:[(data) => { return (data.results && data.results.length == 1 && data.results[0].data && data.results[0].data.length > 0); }]})
        .then( (data) => {
          resolve({status:'Success',data:data});
        })
        .catch( (reason) => {
          reject({status:'Failure',data:reason});
        });
    });
  }

  /**
   * get just one sistema from Mapa da Informação based on Sistema name
   * @param  {string} sistema Name of sistema
   * @return {Promise}         promise to requested method results
   */
  getSistema(sistema) {
    return new Promise( (resolve,reject) => {
      if (!sistema || sistema.length == 0) reject({status:'Failure',data:'Invalid argument'});
      let lwSistema = sistema.toLowerCase();
      let statement = baseStatements['oneSistema'];
      let payload = this._getDataQueryArguments(statement,{'_SISTEMA_':lwSistema});
      this._fetchResults({action:'query', payload:payload, authentication:this.authentication, validation:[(data) => { return (data.results && data.results.length == 1 && data.results[0].data && data.results[0].data.length > 0); }]})
        .then( (data) => resolve({status:'Success',data:data}) )
        .catch( (reason) => reject({status:'Failure',data:reason}) );
    });
  }

  /**
   * get all database users of a sistema
   * @param  {string} sistema Name of sistema
   * @return {Promise}         primise to requested method results
   */
  getAllSistemaDbUsers(sistema) {
    return new Promise( (resolve,reject) => {
      if (!sistema || sistema.length == 0) reject({status:'Failure',data:'Invalid argument'});
      let lwSistema = sistema.toLowerCase();
      let statement = baseStatements['allSistemaDBUsers'];
      let payload = this._getDataQueryArguments(statement, {'_SISTEMA_': lwSistema});
      this._fetchResults({action:'query', payload:payload, authentication:this.authentication, validation:[(data) => { return (data.results && data.results.length == 1 && data.results[0].data && data.results[0].data.length > 0); }]})
        .then( (data) => resolve({status:'Success',data:data}))
        .catch( (reason) => reject({status:'Failure',data:reason}));
    })
  }

  /**
   * get a list of tables with READ access from a list of users
   * @param  {Array[string]} users list of users
   * @return {Promise}         promise of requested method results
   */
  getTablesReadByUser(users) {
    return new Promise( (resolve,reject) => {
      if (!users || users.length == 0) reject({status:'Failure',data:'Invalid argument'});
      let statement = baseStatements['allTablesReadBySistema'];
      let payload = this._getDataQueryArguments(statement, {'_CODIGOS_': users});
      this._fetchResults({action:'query', payload:payload, authentication:this.authentication, validation:[(data) => { return (data.results && data.results.length == 1 && data.results[0].data && data.results[0].data.length > 0); }],
      parseFunction:(data) => {
        let parsedResults = [];
        let results = data.results[0].data;
        results.map( (r) => {
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
        } )
        return parsedResults;
      }})
        .then( (data) => resolve({status:'Success',data:data}))
        .catch( (reason) => reject({status:'Failure',data:reason}) );
    });
  }

  /**
   * get one tabela from name
   * @param  {string} tabela name of tabela
   * @return {Promise}        promise for requested results
   */
  getTabela(tabela) {
    return new Promise( (resolve,reject) => {
      if (!tabela || tabela.length == 0) reject({status:'Failure',data:'Invalid argument'});
      let lwTabela = tabela.replace(/ /g,'_').toLowerCase();
      let statement = baseStatements['oneTabela'];
      let payload = this._getDataQueryArguments(statement, {'_TABELA_': lwTabela});
      this._fetchResults({action:'query', payload:payload, authentication:this.authentication, validation:[(data) => { return (data.results && data.results.length == 1 && data.results[0].data && data.results[0].data.length > 0); }]})
        .then( (data) => resolve({status:'Success',data:data}))
        .catch( (reason) => reject({status:'Failure',data:reason}));
    });
  }
}

export default MapaInformacaoConnector;
