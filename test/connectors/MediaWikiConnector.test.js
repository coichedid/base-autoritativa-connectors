import chai from 'chai';
import nock from 'nock';
import MediaWikiConnector from '../../src/connectors/MediaWikiConnector';

let should = chai.should();
let expect = chai.expect;
let log = (msg) => console.log(msg);

let baseStatements = {
  "tabelasWiki":{query:'%5B%5BPossui+direito+de+leitura+em%3A%3A%2B%5D%5D%7C%3FPossui+direito+de+leitura+em%7Cmainlabel%3D-+',action:'ask',format:'json'},
  "create_page":{title:'__PAGETITLE__',section:0,text:'__BODY__',token:'__TOKEN__',action:'edit',format:'json'},
  "get_token":{action:'query',meta:'tokens'}
};

let mediawikiURI = 'http://localhost';
let mediaWikiConnector;

let tabelasWikiResponse = {
  	"query": {
  		"printrequests": [
  			{
  				"label": "Possui direito de leitura em",
  				"key": "Possui_direito_de_leitura_em",
  				"redi": "",
  				"typeid": "_wpg",
  				"mode": 1,
  				"format": ""
  			}
  		],
  		"results": {
  			"BD Dinâmica# dd3f9824b3f31a5651323ef171a2a7b6": {
  				"printouts": {
  					"Possui direito de leitura em": [
  						{
  							"fulltext": "Informix.bd tecn.informix.age",
  							"fullurl": "http://wiki.devdc.ons.org.br/wiki/Informix.bd_tecn.informix.age",
  							"namespace": 0,
  							"exists": "1",
  							"displaytitle": ""
  						},
  						{
  							"fulltext": "Informix.bd tecn.informix.cos",
  							"fullurl": "http://wiki.devdc.ons.org.br/wiki/Informix.bd_tecn.informix.cos",
  							"namespace": 0,
  							"exists": "",
  							"displaytitle": ""
  						}
  					]
  				}
  			}
  		},
  		"serializer": "SMW\\Serializers\\QueryResultSerializer",
  		"version": 2,
  		"meta": {
  			"hash": "10b16f7992532984b65f19763d868a38",
  			"count": 43,
  			"offset": 0,
  			"source": "",
  			"time": "0.640393"
  		}
  	}
  };

let tabelasResponse = {
    tabelas:[
      'Informix.bd tecn.informix.age',
      'Informix.bd tecn.informix.cos'
    ]
};

describe('MediaWikiConnector', () => {
  before(() => {
    mediaWikiConnector = new MediaWikiConnector(mediawikiURI);
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('shoould list known Tabela de Banco de Dados on Wiki', (done) => {
    // set nock interceptor
    let mediWikiMock = nock(mediawikiURI)
                            // .log(log)
                            .get('/api.php')
                            .query(baseStatements['tabelasWiki'])
                            .reply(200,tabelasWikiResponse);
    mediaWikiConnector.getAllTabelasBancoDeDados()
      .then( (results) => {
        mediWikiMock.done();
        results.should.be.ok;
        results.should.be.deep.equal(tabelasResponse);
        done();
      } )
      .catch( (reason) => done(reason) );
  });

  it('should handle error from media wiki on list known Tabela de Banco de Dados', (done) => {
    // set nock interceptor
    let mediWikiMock = nock(mediawikiURI)
                            //.log(log)
                            .get('/api.php')
                            .query(baseStatements['tabelasWiki'])
                            .reply(500,{statusMessage:'Unknown error'});
    mediaWikiConnector.getAllTabelasBancoDeDados()
      .then( (results) => {
        mediWikiMock.done();
        done('Unhandled error');
      } )
      .catch( (reason) => {
        mediWikiMock.done();
        reason.should.be.deep.equal({statusMessage:'Unknown error'});
        done();
      } )
  });

  it('should handle unknown error from media wiki on list known Tabela de Banco de Dados', (done) => {
    // set nock interceptor
    let mediWikiMock = nock(mediawikiURI)
                            //.log(log)
                            .get('/api.php')
                            .query(baseStatements['tabelasWiki'])
                            .replyWithError('Unknown error');
    mediaWikiConnector.getAllTabelasBancoDeDados()
      .then( (results) => {
        mediWikiMock.done();
        done('Unhandled error');
      } )
      .catch( (reason) => {
        mediWikiMock.done();
        reason.should.be.equal('Unknown error');
        done();
      } )
  });


});
