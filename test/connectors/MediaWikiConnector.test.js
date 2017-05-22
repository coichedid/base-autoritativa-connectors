import chai from 'chai';
import nock from 'nock';
import sinon from 'sinon';
import MediaWikiConnector from '../../src/connectors/MediaWikiConnector';
import bot from 'nodemw';

let should = chai.should();
let expect = chai.expect;
let log = (msg) => console.log(msg);

let baseStatements = {
  "tabelasWiki":{query:'%5B%5BPossui+direito+de+leitura+em%3A%3A%2B%5D%5D%7C%3FPossui+direito+de+leitura+em%7Cmainlabel%3D-+',action:'ask',format:'json'},
  "create_page":{title:'__PAGETITLE__',section:0,text:'__BODY__',token:'__TOKEN__',action:'edit',format:'json'},
  "get_token":{action:'query',meta:'tokens',format:'json'}
};

let mockStubs = {
  edit:{}
}

let mediawikiServer = 'localhost';
let mediawikiURI = 'http://' + mediawikiServer;
let mediaWikiConnector;

let mediaWikiVersion = {
  "batchcomplete":"",
  "query":{
    "general":{
      "mainpage":"P\u00e1gina principal",
      "base":"http://wiki.devdc.ons.org.br/wiki/P%C3%A1gina_principal",
      "sitename":"Arquitetura",
      "logo":"http://wiki.devdc.ons.org.br/images/0/05/WikiLogo.jpg",
      "generator":"MediaWiki 1.28.0",
      "phpversion":"7.0.15-0ubuntu0.16.04.4",
      "phpsapi":"apache2handler",
      "dbtype":"mysql",
      "dbversion":"5.7.18-0ubuntu0.16.04.1",
      "externalimages":[""],
      "langconversion":"",
      "titleconversion":"",
      "linkprefixcharset":"",
      "linkprefix":"",
      "linktrail":"/^([\u00e1\u00e2\u00e3\u00e0\u00e9\u00ea\u1ebd\u00e7\u00ed\u00f2\u00f3\u00f4\u00f5q\u0303\u00fa\u00fc\u0171\u0169a-z]+)(.*)$/sDu",
      "legaltitlechars":"%!\"$&'()*,\\-.\\/0-9:;=?@A-Z\\\\^_`a-z~\\x80-\\xFF+",
      "invalidusernamechars":"@:",
      "fixarabicunicode":"",
      "fixmalayalamunicode":"",
      "case":"first-letter",
      "lang":"pt-br",
      "fallback":[{"code":"pt"},
      {"code":"en"}],
      "fallback8bitEncoding":
      "windows-1252",
      "writeapi":"",
      "maxarticlesize":2097152,
      "timezone":"America/Sao_Paulo",
      "timeoffset":-180,
      "articlepath":"/wiki/$1",
      "scriptpath":"",
      "script":"/index.php",
      "variantarticlepath":false,
      "server":"http://wiki.devdc.ons.org.br",
      "servername":"wiki.devdc.ons.org.br",
      "wikiid":"my_wiki",
      "time":"2017-05-22T15:39:36Z",
      "uploadsenabled":"",
      "maxuploadsize":104857600,
      "minuploadchunksize":1024,
      "thumblimits":[120,150,180,200,250,300],
      "imagelimits":[{"width":320,"height":240},{"width":640,"height":480},{"width":800,"height":600},{"width":1024,"height":768},{"width":1280,"height":1024}],
      "favicon":"http://wiki.devdc.ons.org.br/favicon.ico",
      "centralidlookupprovider":"local",
      "allcentralidlookupproviders":["local"],
      "interwikimagic":"",
      "magiclinks":[]
    }
  }
};

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
    mediaWikiConnector = new MediaWikiConnector(mediawikiServer);
  });

  afterEach(() => {
    nock.cleanAll();
    for (let mockKey in mockStubs) {
      if (mockStubs[mockKey].restore)
        mockStubs[mockKey].restore();
    }
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
    let responses = [
      {
        "result": "Success",
        "pageid": 1476,
        "title": tabelasResponse.tabelas[0],
        "contentmodel": "wikitext",
        "nochange": ""
      },
      {
        "result": "Success",
        "pageid": 1476,
        "title": tabelasResponse.tabelas[1],
        "contentmodel": "wikitext",
        "nochange": ""
      }
    ];
    let calls = 0;
    mockStubs.edit = sinon.stub(bot.prototype,'edit');
    mockStubs.edit.callsFake( (title, content, summary, callback) => {
      let resp = Object.assign({},responses[calls]);
      calls += 1;
      callback(null,resp);
    });

    mediaWikiConnector.createPageTabelaDeBancoDeDados(tabelasResponse.tabelas, 'token_criado')
      .then( (data) => {
        mockStubs.edit.restore();
        expect(data).to.exists;
        data.should.be.deep.equal({status:'Success',data:responses});
        done();
      })
      .catch( (reason) => {
        mockStubs.edit.restore();
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
    let responses = [
      {
        "result": "Success",
        "pageid": 1476,
        "title": tabelasResponse.tabelas[0],
        "contentmodel": "wikitext",
        "nochange": ""
      },
      {
        "result": "Failure",
        "pageid": 1476,
        "title": tabelasResponse.tabelas[1],
        "contentmodel": "wikitext",
        "nochange": ""
      }
    ];
    let calls = 0;
    mockStubs.edit = sinon.stub(bot.prototype,'edit');
    mockStubs.edit.callsFake( (title, content, summary, callback) => {
      let resp = Object.assign({},responses[calls]);
      calls += 1;
      callback(null,resp);
    });

    mediaWikiConnector.createPageTabelaDeBancoDeDados(tabelasResponse.tabelas, 'token_criado')
      .then( (data) => {
        mockStubs.edit.restore();
        done('Unhandled exception');
      })
      .catch( (reason) => {
        mockStubs.edit.restore();
        expect(reason).be.exists;
        reason.should.be.deep.equal({status:'Failure',data:responses});
        done();
      });
  });

  it('should handle unknown error on create page of Tabela de Banco de Dados', (done) => {
    // let statements = [];
    // let mediaWikiMocks = [];
    // tabelasResponse.tabelas.forEach( (tabela,index) => {
    //   let createStatement = Object.assign({}, baseStatements['create_page']);
    //   createStatement.title = tabela;
    //   createStatement.text = pageBody;
    //   createStatement.token = "token_criado";
    //   statements.push(createStatement);
    //   // set nock interceptor
    //   let mediaWikiMock = nock(mediawikiURI)
    //       //.log(log)
    //       .get('/api.php')
    //       .query(createStatement)
    //       .replyWithError('Unknown error');
    //   mediaWikiMocks.push(mediaWikiMock);
    // } );
    let responses = [
      {
        "result": "Success",
        "pageid": 1476,
        "title": tabelasResponse.tabelas[0],
        "contentmodel": "wikitext",
        "nochange": ""
      },
      {
        "result": "Failure",
        "pageid": 1476,
        "title": tabelasResponse.tabelas[1],
        "contentmodel": "wikitext",
        "nochange": ""
      }
    ];
    let calls = 0;
    mockStubs.edit = sinon.stub(bot.prototype,'edit');
    mockStubs.edit.callsFake( (title, content, summary, callback) => {
      throw 'Unknown error';
    });

    mediaWikiConnector.createPageTabelaDeBancoDeDados(tabelasResponse.tabelas, 'token_criado')
      .then( () => {
        mockStubs.edit.restore();
        // mediaWikiMocks.forEach( (mock) => mock.done() );
        done('Unhandled exception');
      })
      .catch( (reason) => {
        mockStubs.edit.restore();
        // mediaWikiMocks.forEach( (mock) => mock.done() );
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
