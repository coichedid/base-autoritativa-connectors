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

let pageBody = '%7B%7BTemplateTabelaBancoDados%7D%7D%0A%7B%7BTabela+de+Banco+de+Dados%7D%7D%0A';

let tabelasResponse = {
    tabelas:[
      'Informix.bd tecn.informix.age',
      'Informix.bd tecn.informix.cos'
    ]
};

let tokenResponse = {
    "batchcomplete": "",
    "query": {
        "tokens": {
            "csrftoken": "59322ed9a6c171b759070c6b60b5591c591c49f0+\\"
        }
    }
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
    let mediaWikiMock = nock(mediawikiURI)
                            // .log(log)
                            .get('/api.php')
                            .query(baseStatements['tabelasWiki'])
                            .reply(200,tabelasWikiResponse);
    mediaWikiConnector.getAllTabelasBancoDeDados()
      .then( (results) => {
        mediaWikiMock.done();
        results.should.be.ok;
        results.should.be.deep.equal({status:'Success',data:tabelasResponse});
        done();
      } )
      .catch( (reason) => done(reason) );
  });

  it('should handle error from media wiki on list known Tabela de Banco de Dados', (done) => {
    // set nock interceptor
    let mediaWikiMock = nock(mediawikiURI)
                            //.log(log)
                            .get('/api.php')
                            .query(baseStatements['tabelasWiki'])
                            .reply(500,{statusMessage:'Unknown error'});
    mediaWikiConnector.getAllTabelasBancoDeDados()
      .then( (results) => {
        mediaWikiMock.done();
        done('Unhandled error');
      } )
      .catch( (reason) => {
        mediaWikiMock.done();
        reason.should.be.deep.equal({status:'Failure',data:{statusMessage:'Unknown error'}});
        done();
      } )
  });

  it('should handle unknown error from media wiki on list known Tabela de Banco de Dados', (done) => {
    // set nock interceptor
    let mediaWikiMock = nock(mediawikiURI)
                            //.log(log)
                            .get('/api.php')
                            .query(baseStatements['tabelasWiki'])
                            .replyWithError('Unknown error');
    mediaWikiConnector.getAllTabelasBancoDeDados()
      .then( (results) => {
        mediaWikiMock.done();
        done('Unhandled error');
      } )
      .catch( (reason) => {
        mediaWikiMock.done();
        reason.should.be.deep.equal({status:'Failure',data:'Unknown error'});
        done();
      } )
  });

  it('should create a list of Tabela de Banco de Dados pages based on list of names and a authentication token', (done) => {
    let statements = [];
    let mediaWikiMocks = [];
    tabelasResponse.tabelas.forEach( (tabela) => {
      let createStatement = Object.assign({}, baseStatements['create_page']);
      createStatement.title = tabela;
      createStatement.text = pageBody;
      createStatement.token = "token_criado";
      statements.push(createStatement);
      // set nock interceptor
      let mediaWikiMock = nock(mediawikiURI)
          //.log(log)
          .get('/api.php')
          .query(createStatement)
          .reply(200,{edit:{result:'Success'}});
      mediaWikiMocks.push(mediaWikiMock);
    } );

    mediaWikiConnector.createPageTabelaDeBancoDeDados(tabelasResponse.tabelas, 'token_criado')
      .then( (data) => {
        mediaWikiMocks.forEach( (mock) => mock.done() );
        expect(data).to.exists;
        data.should.be.deep.equal({status:'Success',data:[{ nome: tabelasResponse.tabelas[0], result: 'Success' },{ nome: tabelasResponse.tabelas[1], result: 'Success' }]});
        done();
      })
      .catch( (reason) => {
        mediaWikiMocks.forEach( (mock) => mock.done() );
        done(reason);
      } )
  });

  it('should handle no nomes on create page of Tabela de Banco de DAdos', (done) => {
    mediaWikiConnector.createPageTabelaDeBancoDeDados(null,'token_criado')
      .then( (data) => {
        done('Unhandled exception');
      })
      .catch( (reason) => {
        reason.should.be.deep.equal({status:'Failure',data:'No nomes list provided'});
        done();
      })
  });

  it('should handle empty nomes on create page of Tabela de Banco de Dados', (done) => {
    mediaWikiConnector.createPageTabelaDeBancoDeDados([],'token_criado')
      .then( (data) => {
        done('Unhandled exception');
      })
      .catch( (reason) => {
        reason.should.be.deep.equal({status:'Failure',data:'No nomes list provided'});
        done();
      })
  });

  it('should handle no token provided on create page of Tabela de Banco de Dados', (done) => {
    mediaWikiConnector.createPageTabelaDeBancoDeDados(tabelasResponse.tabelas)
      .then( (data) => {
        done('Unhandled exception');
      })
      .catch( (reason) => {
        reason.should.be.deep.equal({status:'Failure',data:'No token provided'});
        done();
      })
  });

  it('should handle empty token provided on create page of Tabela de Banco de Dados', (done) => {
    mediaWikiConnector.createPageTabelaDeBancoDeDados(tabelasResponse.tabelas,'')
      .then( (data) => {
        done('Unhandled exception');
      })
      .catch( (reason) => {
        reason.should.be.deep.equal({status:'Failure',data:'No token provided'});
        done();
      })
  });


  it('should handle failure on create page of Tabela de Banco de Dados', (done) => {
    let statements = [];
    let mediaWikiMocks = [];
    tabelasResponse.tabelas.forEach( (tabela,index) => {
      let createStatement = Object.assign({}, baseStatements['create_page']);
      createStatement.title = tabela;
      createStatement.text = pageBody;
      createStatement.token = "token_criado";
      statements.push(createStatement);
      // set nock interceptor
      let mediaWikiMock = nock(mediawikiURI)
          //.log(log)
          .get('/api.php')
          .query(createStatement)
          .reply(200,{edit:{result:(index == 0?'Success':'Failure')}});
      mediaWikiMocks.push(mediaWikiMock);
    } );

    mediaWikiConnector.createPageTabelaDeBancoDeDados(tabelasResponse.tabelas, 'token_criado')
      .then( (data) => {
        mediaWikiMocks.forEach( (mock) => mock.done() );
        done('Unhandled exception');
      })
      .catch( (reason) => {
        mediaWikiMocks.forEach( (mock) => mock.done() );
        expect(reason).be.exists;
        reason.should.be.deep.equal({status:'Failure',data:[{ nome: tabelasResponse.tabelas[0], result: 'Success' },{ nome: tabelasResponse.tabelas[1], result: 'Failure' }]});
        done();
      });
  });

  it('should handle unknown error on create page of Tabela de Banco de Dados', (done) => {
    let statements = [];
    let mediaWikiMocks = [];
    tabelasResponse.tabelas.forEach( (tabela,index) => {
      let createStatement = Object.assign({}, baseStatements['create_page']);
      createStatement.title = tabela;
      createStatement.text = pageBody;
      createStatement.token = "token_criado";
      statements.push(createStatement);
      // set nock interceptor
      let mediaWikiMock = nock(mediawikiURI)
          //.log(log)
          .get('/api.php')
          .query(createStatement)
          .replyWithError('Unknown error');
      mediaWikiMocks.push(mediaWikiMock);
    } );

    mediaWikiConnector.createPageTabelaDeBancoDeDados(tabelasResponse.tabelas, 'token_criado')
      .then( () => {
        mediaWikiMocks.forEach( (mock) => mock.done() );
        done('Unhandled exception');
      })
      .catch( (reason) => {
        mediaWikiMocks.forEach( (mock) => mock.done() );
        reason.should.be.deep.equal({status:'Failure',data:'Unknown error'});
        done();
      });
  });

  it('should get an authentication token from media wiki', (done) => {
    // set nock interceptor
    let mediaWikiMock = nock(mediawikiURI)
                            // .log(log)
                            .get('/api.php')
                            .query(baseStatements['get_token'])
                            .reply(200,tokenResponse);
    mediaWikiConnector.getAuthenticationToken()
      .then( (results) => {
        mediaWikiMock.done();
        results.should.be.ok;
        results.should.be.deep.equal({status:'Success',data:encodeURI(tokenResponse.query.tokens.csrftoken)});
        done();
      } )
      .catch( (reason) => done(reason) );
  });

  it('should handle an error on get authentication token from media wiki', (done) => {
    // set nock interceptor
    let mediaWikiMock = nock(mediawikiURI)
                            // .log(log)
                            .get('/api.php')
                            .query(baseStatements['get_token'])
                            .replyWithError('Unknown error');
    mediaWikiConnector.getAuthenticationToken()
      .then( () => {
        mediaWikiMock.done();
        done('Unhandled exception');
      })
      .catch( (reason) => {
        mediaWikiMock.done();
        reason.should.be.deep.equal({status:'Failure',data:'Unknown error'});
        done();
      });
  });
});
