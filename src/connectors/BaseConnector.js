import {Client} from 'node-rest-client';
import ConnectorException from './ConnectorException';
import bot from 'nodemw';

let client = new Client();
let methodsArgs = {};
/**
 * Connector to Mapa da Informacao system
 * @type {class}
 */
class BaseConnector {
  /**
   * Register methods exposed on Neo4J
   * @param {string} baseURL Base Url of Neo4J server
   * @param {object} methods Key/Value list of methods to be registered
   * @return {void}
   */
  _registerMethods(server, methods) {
    this.botClient = new bot({
      protocol:'http',
      server:server,
      path:'',
      debug:false
    });
    let baseURL = 'http://' + server;
    for (let key in methods) {
      let path = methods[key];
      let [action, verb] = key.split('_');
      let [p,a] = path.split('?');
      if (a) {
        let params = a.split('&');
        params.forEach( (param) => {
          let [k,v] = param.split('=');
          if (!methodsArgs[action]) methodsArgs[action] = {};
          methodsArgs[action][k] = v;
        } );
      }
      client.registerMethod(action, baseURL + p, verb);
    }
  }

  /**
   * Prepare arguments for a POST request
   * @param  {object} data payload data passed on POST action
   * @param  {object} pathSubs Key/Value object with path substtutions
   * @param  {object} parameters Key/Value object with parameters passed on GET action
   * @param  {object} headers Key/Value object headers
   * @param  {string} authentication token authentication
   * @return {object}           Argument object
   */
  _getArguments({action, data, pathSubs, parameters, headers, authentication}={}) {
    let args = {
      parameters:{}
    };
    if (data) args.data = data;
    if (pathSubs) args.path = pathSubs;
    if (parameters) args.parameters = parameters;
    if (headers) args.headers = headers; else args.headers = {};
    if (action && methodsArgs[action]) args.parameters = Object.assign(args.parameters,methodsArgs[action]);
    args.headers = Object.assign(args.headers,{"Content-Type": "application/json"},authentication?{Authorization:authentication}:{});
    return args;
  }

  /**
   * base function to parse results from Neo4J
   * @param  {object} data          Neo4J response data
   * @param  {function} parseFunction custom parse function
   * @return {Array[object]}               array of parsed results
   */
  _parseResults(data, parseFunction) {
    let parsedResults = [];
    if (parseFunction) parsedResults = parseFunction(data);
    else {
      let results = data.results[0].data;
      results.map((r)=>{
        if (!r.rest || r.rest.length != 1) return;
        let rData = r.rest[0].data;
        rData['id'] = r.rest[0].metadata.id;
        parsedResults.push(rData);
        return;
      });
    }
    return parsedResults;
  }

  /**
   * recursive validation of returned data
   * @param  {object} data       data returned from Neo4J
   * @param  {Array[string] || function} attributes hierarchal names to be used to check a valid response data or validation function
   * @return {boolean}            is Valid data
   */
  _validateResults(data,attributes) {
    if (!attributes || attributes.length == 0) return true;
    let validPosition = false;
    let newData = data;
    if (typeof attributes[0] === 'function') validPosition = attributes[0](data);
    else {
      validPosition = data[attributes[0]];
      newData = data[attributes[0]];
    }
    return validPosition?this._validateResults(newData,attributes.slice(1)):false;
  }

  /**
   * Base function to connect to Neo4J and get results
   * @param  {string} action        name of remote method registered on client
   * @param  {object} pathSubs          key/value substtutions on path
   * @param  {object} args          parameters to be passed on query string
   * @param  {object} payload       data to be serialized and passed on a POST action
   * @param  {object} headers Key/Value object with headers
   * @param  {string} authentication token authentication
   * @param  {Array[string]} validation    hierarchal names to be used to check a valid response data
   * @param  {function} parseFunction Used to parse returned data. If null, raw data is returned
   * @return {Promise}               a Promise to requested method results
   */
  _fetchResults({action, pathSubs, args, payload, headers, authentication, validation, parseFunction} = {}) {
    return new Promise( (resolve, reject) => {
      let connectionArguments = this._getArguments({action:action, data:payload,pathSubs:pathSubs,parameters:args,headers:headers,authentication:authentication});
      client.methods[action](connectionArguments, (data, response) => {
        if (response.statusCode >= 400) {
          reject(data);
        }
        if (data.errors && data.errors.length > 0) {
          reject(data.erros);
        }
        else if (data.error) {
          reject(data.error);
        }
        else {
          if (!data || !this._validateResults(data,validation)) {
            resolve({});
          }
          else {
            let parsedData = this._parseResults(data,parseFunction);
            resolve(parsedData);
          }
        }
      })
      .on('error', (err) => {
        reject('Unknown error');
      });
    } );
  }
}

export default BaseConnector;
