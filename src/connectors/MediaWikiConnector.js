import {Client} from 'node-rest-client';
import BaseConnector from './BaseConnector';

let baseStatements = {
  "tabelasWiki":"%5B%5BPossui+direito+de+leitura+em%3A%3A%2B%5D%5D%7C%3FPossui+direito+de+leitura+em%7Cmainlabel%3D-+",
  "create_page":{title:'__PAGETITLE__',section:0,text:'__BODY__',token:'__TOKEN__',action:'edit',format:'json'},
  "get_token":{meta:'tokens'}
};

let pageBody = '{{TemplateTabelaBancoDados}}\n{{Tabela de Banco de Dados}}';

/**
 * Connector to Media Wiki
 * @type {class}
 */
class MediaWikiConnector extends BaseConnector {
  constructor(baseURL) {
    super();
    this.baseURL = baseURL;
    this._registerMethods(this.baseURL, {'ask_GET':'/api.php?action=ask&format=json'});
    this._registerMethods(this.baseURL, {'edit_POST':'/api.php'});
    this._registerMethods(this.baseURL, {'token_GET':'/api.php?action=query&format=json'});
  }

  getAllTabelasBancoDeDados() {
    return new Promise( (resolve,reject) => {
      let args = {query:baseStatements['tabelasWiki']};
      let fetchArgs = {action:'ask',args:args, validation:['query','results'],parseFunction:(data) => {
        let results = {'tabelas':[]};
        for (let key in data.query.results) {
          let tabelas = data.query.results[key].printouts['Possui direito de leitura em'];
          tabelas.forEach( (item) => {
            let nomeTabela = item['fulltext'];
            if (!results.tabelas.includes(nomeTabela)) results.tabelas.push(nomeTabela);
          } );
        }
        return results;
      }};
      this._fetchResults(fetchArgs)
        .then( (data) => resolve({status:'Success',data:data}))
        .catch( (reason) => reject({status:'Failure',data:reason}))
    });
  }

  createPageTabelaDeBancoDeDados(nomes,token) {
    let promises = [];
    return new Promise( (resolve,reject) => {
      if (!nomes || nomes.length == 0) return reject({status:'Failure',data:'No nomes list provided'});
      if (!token || token.length == 0) return reject({status:'Failure',data:'No token provided'});
      nomes.forEach( (nome) =>{
        let promise = new Promise( (resolve,reject) => {
          this.botClient.edit(nome,pageBody,'',(err,data) =>{
            if(err) reject(err);
            else resolve(data);
          })
        });
        promises.push(promise);
      });
      Promise.all(promises)
        .then( (data) => {
          let rejectItems = 0;
          data.forEach( (item) => {
            if (item.result == 'Failure') rejectItems++;
          });
          if (rejectItems > 0) reject({status:'Failure',data:data});
          else resolve({status:'Success',data:data});
        })
        .catch( (reason) => {
          reject({status:'Failure',data:reason});
        });
    });
  }

  getAuthenticationToken() {
    return new Promise( (resolve,reject) => {
      let args = Object.assign({},baseStatements['get_token']);
      let fetchArgs = {action:'token',args:args,validation:['query','tokens','csrftoken'],parseFunction: (data) => {
        return encodeURI(data.query.tokens.csrftoken);
      }};
      this._fetchResults(fetchArgs)
      .then( (data) => resolve({status:'Success',data:data}))
      .catch( (reason) => reject({status:'Failure',data:reason}))
    });
  }
}

export default MediaWikiConnector;
