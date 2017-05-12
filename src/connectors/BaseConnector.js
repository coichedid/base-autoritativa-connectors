import {Client} from 'node-rest-client';
import ConnectorException from './ConnectorException';

let client = new Client();

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
  _registerMethods(baseURL, methods) {
    for (let key in methods) {
      let [action, verb] = key.split('_');
      client.registerMethod(action, baseURL + methods[key], verb);
    }
  }

  /**
   * Prepare arguments for a POST request
   * @param  {string} statement Query statement to be passed to Neo4J
   * @param  {object} substtutions Key/Value object with query substtutions
   * @param  {string} authentication token authentication
   * @return {object}           Argument object
   */
  _getArguments(statement, substtutions, authentication) {
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
  _parseResults(data, parseFunction) {
    throw new ConnectorException('Not implemented');
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
   * @param  {object} args          parameters to be passed on query string
   * @param  {object} payload       data to be serialized and passed on a POST action
   * @param  {object} payloadParams Key/Value object with query substtutions
   * @param  {string} authentication token authentication
   * @param  {Array[string]} validation    hierarchal names to be used to check a valid response data
   * @param  {function} parseFunction Used to parse returned data. If null, raw data is returned
   * @return {Promise}               a Promise to requested method results
   */
  _fetchResults(action, args, payload, payloadParams, authentication, validation, parseFunction) {
    return new Promise( (resolve, reject) => {
      let payloadData = this._getArguments(payload,payloadParams,authentication);
      client.methods[action](payloadData, (data, response) => {
        if (data.errors && data.errors.length > 0) {
          reject(data.errors);
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
      });
    } );
  }
}

export default BaseConnector;
