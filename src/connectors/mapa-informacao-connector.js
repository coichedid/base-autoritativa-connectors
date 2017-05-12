import {Client} from 'node-rest-client';

let client = new Client();

let baseStatements = {
  "allSistemas":"MATCH (v:`Sistema`) RETURN v ORDER BY v. `Identificador` SKIP { s } LIMIT { l }",
  "oneSistema":"MATCH (v:`Sistema`) WHERE (lower(v.`Identificador`) CONTAINS '_SISTEMA_' OR lower(v.`Código`) CONTAINS '_SISTEMA_') RETURN v ORDER BY v.`Identificador` SKIP { s } LIMIT { l }",
  "allSistemaDBUsers":"MATCH (v:`Login`) WHERE (lower(v.`Identificador`) CONTAINS '_SISTEMA_' OR lower(v.`Código`) CONTAINS '_SISTEMA_') RETURN v ORDER BY v.`Identificador` SKIP { s } LIMIT { l }",
  "allTablesReadBySistema":"MATCH (vFrom)-[r]->(vTo) WHERE (id(vFrom) IN [_CODIGOS_] OR id(vTo) IN [_CODIGOS_]) AND type(r) = 'é uma Tabela com leitura pelo Login' RETURN id(vFrom), vFrom.`Identificador`, type(r), id(vTo), vTo.`Identificador` ORDER BY r.type, vFrom.`Identificador`, vTo.`Identificador` SKIP { s } LIMIT { l }"
}
/**
 * Register methods exposed on Neo4J
 * @return {void}
 */
function _registerMethods(baseURL) {
  client.registerMethod('query', baseURL + '/db/data/transaction/commit', 'POST');
}

/**
 * Prepare arguments for a POST request
 * @param  {string} statement Query statement to be passed to Neo4J
 * @param  {object} substtutions Key/Value object with query substtutions
 * @param  {string} authentication token authentication
 * @return {object}           Argument object
 */
function _getArguments(statement, substtutions, authentication) {
  let queryStatement = statement;
  if (substtutions) {
    for (let key in substtutions) {
      let regex = new RegExp(key,'g');
      queryStatement = queryStatement.replace(regex,substtutions[key]);
    }
  }
  let args = {
    data:{
      statements:[
        {
          statement:queryStatement,
          parameters:{s:0,l:10000},
          resultDataContents:["REST"]
        }
      ]
    },
    headers: {"Content-Type": "application/json"}
  }
  if (authentication != "") args.headers.Authorization = authentication;
  return args;
}

/**
 * base function to parse results from Neo4J
 * @param  {object} data          Neo4J response data
 * @param  {function} parseFunction custom parse function
 * @return {Array[object]}               array of parsed results
 */
function _parseResults(data, parseFunction) {
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
 * recursive validation of returned data
 * @param  {object} data       data returned from Neo4J
 * @param  {Array[string] || function} attributes hierarchal names to be used to check a valid response data or validation function
 * @return {boolean}            is Valid data
 */
function _validateResults(data,attributes) {
  if (!attributes || attributes.length == 0) return true;
  let validPosition = false;
  let newData = data;
  if (typeof attributes[0] === 'function') validPosition = attributes[0](data);
  else {
    validPosition = data[attributes[0]];
    newData = data[attributes[0]];
  }
  return validPosition?_validateResults(newData,attributes.slice(1)):false;
}

/**
 * Base function to connect to Neo4J and get results
 * @param  {string} action        name of remote method registered on client
 * @param  {object} args          parameters to be passed on query string
 * @param  {object} payload       data to be serialized and passed on a POST action
 * @param  {object} payloadParams Key/Value object with query substtutions
 * @param  {string} authentication token authentication
 * @param  {Array[string]} validation    hierarchal names to be used to check a valid response data
 * @param  {function} parseFunction Used to parse returned data. If null, raw data is returned
 * @return {Promise}               a Promise to requested method results
 */
function _fetchResults(action, args, payload, payloadParams, authentication, validation, parseFunction) {
  return new Promise( (resolve, reject) => {
    let payloadData = _getArguments(payload,payloadParams,authentication);
    client.methods[action](payloadData, (data, response) => {
      if (data.errors && data.errors.length > 0) {
        reject(data.errors);
      }
      else {
        if (!data || !_validateResults(data,validation)) {
          resolve({});
        }
        else {
          let parsedData = _parseResults(data,parseFunction);
          resolve(parsedData);
        }
      }
    });
  } );
}

/**
 * Connector to Mapa da Informacao system
 * @type {class}
 */
class MapaInformacaoConnector {
  constructor(baseURL, authentication) {
    this.authentication = authentication;
    this.baseURL = baseURL;
    _registerMethods(this.baseURL);
  }

  /**
   * list all sistemas of Mapa da Informação
   * @return {Promise} promise to requested method results
   */
  getAllSistemas() {
    let statement = baseStatements['allSistemas'];
    return _fetchResults('query', {}, statement, {}, this.authentication, [(data) => { return (data.results && data.results.length == 1 && data.results[0].data && data.results[0].data.length > 0); }]);
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
    return _fetchResults('query',{},statement,{'_SISTEMA_':lwSistema},this.authentication,[(data) => { return (data.results && data.results.length == 1 && data.results[0].data && data.results[0].data.length > 0); }]);
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
    return _fetchResults('query',{}, statement, {'_SISTEMA_': lwSistema}, this.authentication, [(data) => { return (data.results && data.results.length == 1 && data.results[0].data && data.results[0].data.length > 0); }]);
  }

  /**
   * get a list of tables with READ access from a list of users
   * @param  {Array[string]} users list of users
   * @return {Promise}         promise of requested method results
   */
  getTablesReadByUser(users) { 
    if (!users || users.length == 0) return new Promise( (resolve,reject) => reject('Invalid argument') );
    let statement = baseStatements['allTablesReadBySistema'];
    return _fetchResults('query',{}, statement, {'_CODIGOS_': users}, this.authentication, [(data) => { return (data.results && data.results.length == 1 && data.results[0].data && data.results[0].data.length > 0); }], (r,parsedResults) => {
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
}

export default MapaInformacaoConnector;
