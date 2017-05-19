import {Client} from 'node-rest-client';
import BaseConnector from './BaseConnector';

let baseStatements = {
  "tabelasWiki":"%5B%5BPossui+direito+de+leitura+em%3A%3A%2B%5D%5D%7C%3FPossui+direito+de+leitura+em%7Cmainlabel%3D-+",
  "create_page":"title=__PAGETITLE__&section=0&text=__BODY__&token=__TOKEN__"
};

/**
 * Connector to Media Wiki
 * @type {class}
 */
class MediaWikiConnector extends BaseConnector {
  constructor(baseURL) {
    super();
    this.baseURL = baseURL;
    this._registerMethods(this.baseURL, {'ask_GET':'/api.php?action=ask&format=json'});
    this._registerMethods(this.baseURL, {'edit_GET':'/api.php?action=edit&format=json'});
    this._registerMethods(this.baseURL, {'token_GET':'/api.php?action=query&meta=tokens'});
  }

  getAllTabelasBancoDeDados() {
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
    return this._fetchResults(fetchArgs);
  }
}

export default MediaWikiConnector;
