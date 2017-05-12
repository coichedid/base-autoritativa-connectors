import chai from 'chai';
import nock from 'nock';
import MapaInformacaoConnector from '../src/connectors/MapaInformacaoConnector';

let should = chai.should();
let expect = chai.expect;

let baseStatements = {
  "allSistemas":"MATCH (v:`Sistema`) RETURN v ORDER BY v. `Identificador` SKIP { s } LIMIT { l }",
  "oneSistema":"MATCH (v:`Sistema`) WHERE (lower(v.`Identificador`) CONTAINS 'amse' OR lower(v.`Código`) CONTAINS 'amse') RETURN v ORDER BY v.`Identificador` SKIP { s } LIMIT { l }",
  "allSistemaDBUsers":"MATCH (v:`Login`) WHERE (lower(v.`Identificador`) CONTAINS 'amse' OR lower(v.`Código`) CONTAINS 'amse') RETURN v ORDER BY v.`Identificador` SKIP { s } LIMIT { l }",
  "allTablesReadBySistema":"MATCH (vFrom)-[r]->(vTo) WHERE (id(vFrom) IN [2427490,2427339] OR id(vTo) IN [2427490,2427339]) AND type(r) = 'é uma Tabela com leitura pelo Login' RETURN id(vFrom), vFrom.`Identificador`, type(r), id(vTo), vTo.`Identificador` ORDER BY r.type, vFrom.`Identificador`, vTo.`Identificador` SKIP { s } LIMIT { l }",
  "oneTabela":"MATCH (v:`Tabela`) WHERE (lower(v.`Identificador`) = 'informix.bd_tecn.informix.age' OR lower(v.`Código`) = 'informix.bd_tecn.informix.age' OR lower(v.`Nome`) = 'informix.bd_tecn.informix.age') RETURN v"
};
let mapaInformacaoURI = 'http://localhost:7474';
let mapaInformacaoPath = '/db/data/transaction/commit';
let mapaInformacaoConnector;
let sistemasIds = [2428048,2428049];
let loginsIds = [2427490,2427339];
let tabelasIds = [2430009]
let logins = [
  {
    "Código": "amse",
    "Data de Cadastro": "2017-02-24 12:18:10.677000000",
    "Identificador": "informix.bd_tecn.amse"
  },
  {
    "Código": "etlamse",
    "Data de Cadastro": "2017-02-24 12:18:10.937000000",
    "Identificador": "informix.bd_tecn.etlamse"
  }
];
let sistemas = [
  {
    "Status": "Em Produção",
    "Código": "amse",
    "Data de Cadastro": "2017-02-23 18:55:21.210000000",
    "Identificador": "amse",
    "Descrição": "Relatórios de Apuração",
    "Gerência Responsável": "GAC 3",
    "URL de Produção": " http://amse.ons.org.br/intunica/",
    "Gerência Executiva": "GAC",
    "Processo ONS Associado": "Apuração mensal de serviços e encargos de transmissão",
    "Nome": "Sistema de Apuração Mensal de Serviços e Encargos da Transmissão",
    "Diretoria": "DAT"
  },
  {
    "Status": "Em Produção",
    "Código": "anafas",
    "Data de Cadastro": "2017-02-23 18:55:21.210000000",
    "Identificador": "anafas",
    "Gerência Responsável": "GPE 1",
    "Gerência Executiva": "GPE",
    "Processo ONS Associado": "Planejamento e programação da operação elétrica (Submódulos 6.2, 6.3, 6.4, 6.5) / Proteção e controle (Submódulos 11.3, 11.5) / Estudos p reforço da segurança oper elétrica, controle sistêmico e integração de instalações (21.2, 21.3 e 22.3)",
    "Nome": "Programa de Análise de Faltas Simultâneas",
    "Diretoria": "DPP"
  }];
let tabelas = [
  {
    "Código": "age",
    "Data de Cadastro": "2017-02-23 18:55:22.573000000",
    "Identificador": "informix.bd_tecn.informix.age",
    "Descrição": "Lista de agentes, que são cada uma das partes envolvidas em regulamentação, planejamento, acesso, expansão e operação do sistema elétrico, bem como em comercialização e consumo de energia elétrica. O conceito \"agente\" contempla as empresas que participam do ONS ou empresas em países vizinhos que possuem interligação com sistema elétrico sob responsabilidade do ONS.",
    "Número de Linhas": "1938",
    "Nome": "Agente"
  }
];
let tabelasDeSistema = [
  {
    fromId:2369271,
    fromIdentificador:'informix.bd_tecn.informix.age',
    verb:'é uma Tabela com leitura pelo Login',
    toId:2427490,
    toIdentificador:'informix.bd_tecn.amse'
  },
  {
    fromId:2369271,
    fromIdentificador:'informix.bd_tecn.informix.age',
    verb:'é uma Tabela com leitura pelo Login',
    toId:2427339,
    toIdentificador:'informix.bd_tecn.etlamse'
  }
]
let allSistemasResponse = {
  "results": [
    {
      "columns": [
        "v"
      ],
      "data": [
        {
          "rest": [
            {
              "outgoing_relationships": "http://prd-neo4j-01:7474/db/data/node/2428048/relationships/out",
              "labels": "http://prd-neo4j-01:7474/db/data/node/2428048/labels",
              "all_typed_relationships": "http://prd-neo4j-01:7474/db/data/node/2428048/relationships/all/{-list|&|types}",
              "traverse": "http://prd-neo4j-01:7474/db/data/node/2428048/traverse/{returnType}",
              "self": "http://prd-neo4j-01:7474/db/data/node/2428048",
              "property": "http://prd-neo4j-01:7474/db/data/node/2428048/properties/{key}",
              "outgoing_typed_relationships": "http://prd-neo4j-01:7474/db/data/node/2428048/relationships/out/{-list|&|types}",
              "properties": "http://prd-neo4j-01:7474/db/data/node/2428048/properties",
              "incoming_relationships": "http://prd-neo4j-01:7474/db/data/node/2428048/relationships/in",
              "create_relationship": "http://prd-neo4j-01:7474/db/data/node/2428048/relationships",
              "paged_traverse": "http://prd-neo4j-01:7474/db/data/node/2428048/paged/traverse/{returnType}{?pageSize,leaseTime}",
              "all_relationships": "http://prd-neo4j-01:7474/db/data/node/2428048/relationships/all",
              "incoming_typed_relationships": "http://prd-neo4j-01:7474/db/data/node/2428048/relationships/in/{-list|&|types}",
              "metadata": {
                "id": 2428048,
                "labels": [
                  "Sistema"
                ]
              },
              "data": sistemas[0]
            }
          ]
        },
        {
          "rest": [
            {
              "outgoing_relationships": "http://prd-neo4j-01:7474/db/data/node/2428049/relationships/out",
              "labels": "http://prd-neo4j-01:7474/db/data/node/2428049/labels",
              "all_typed_relationships": "http://prd-neo4j-01:7474/db/data/node/2428049/relationships/all/{-list|&|types}",
              "traverse": "http://prd-neo4j-01:7474/db/data/node/2428049/traverse/{returnType}",
              "self": "http://prd-neo4j-01:7474/db/data/node/2428049",
              "property": "http://prd-neo4j-01:7474/db/data/node/2428049/properties/{key}",
              "outgoing_typed_relationships": "http://prd-neo4j-01:7474/db/data/node/2428049/relationships/out/{-list|&|types}",
              "properties": "http://prd-neo4j-01:7474/db/data/node/2428049/properties",
              "incoming_relationships": "http://prd-neo4j-01:7474/db/data/node/2428049/relationships/in",
              "create_relationship": "http://prd-neo4j-01:7474/db/data/node/2428049/relationships",
              "paged_traverse": "http://prd-neo4j-01:7474/db/data/node/2428049/paged/traverse/{returnType}{?pageSize,leaseTime}",
              "all_relationships": "http://prd-neo4j-01:7474/db/data/node/2428049/relationships/all",
              "incoming_typed_relationships": "http://prd-neo4j-01:7474/db/data/node/2428049/relationships/in/{-list|&|types}",
              "metadata": {
                "id": 2428049,
                "labels": [
                  "Sistema"
                ]
              },
              "data": sistemas[1]
            }
          ]
        }
      ]
    }
  ],
  "errors": []
};
let oneSistemaResponse = {
  "results": [
    {
      "columns": [
        "v"
      ],
      "data": [
        {
          "rest": [
            {
              "outgoing_relationships": "http://prd-neo4j-01:7474/db/data/node/2428048/relationships/out",
              "labels": "http://prd-neo4j-01:7474/db/data/node/2428048/labels",
              "all_typed_relationships": "http://prd-neo4j-01:7474/db/data/node/2428048/relationships/all/{-list|&|types}",
              "traverse": "http://prd-neo4j-01:7474/db/data/node/2428048/traverse/{returnType}",
              "self": "http://prd-neo4j-01:7474/db/data/node/2428048",
              "property": "http://prd-neo4j-01:7474/db/data/node/2428048/properties/{key}",
              "outgoing_typed_relationships": "http://prd-neo4j-01:7474/db/data/node/2428048/relationships/out/{-list|&|types}",
              "properties": "http://prd-neo4j-01:7474/db/data/node/2428048/properties",
              "incoming_relationships": "http://prd-neo4j-01:7474/db/data/node/2428048/relationships/in",
              "create_relationship": "http://prd-neo4j-01:7474/db/data/node/2428048/relationships",
              "paged_traverse": "http://prd-neo4j-01:7474/db/data/node/2428048/paged/traverse/{returnType}{?pageSize,leaseTime}",
              "all_relationships": "http://prd-neo4j-01:7474/db/data/node/2428048/relationships/all",
              "incoming_typed_relationships": "http://prd-neo4j-01:7474/db/data/node/2428048/relationships/in/{-list|&|types}",
              "metadata": {
                "id": 2428048,
                "labels": [
                  "Sistema"
                ]
              },
              "data": sistemas[0]
            }
          ]
        }
      ]
    }
  ],
  "errors": []
};
let loginsOneSistemaResponse = {
  "results": [
    {
      "columns": [
        "v"
      ],
      "data": [
        {
          "rest": [
            {
              "outgoing_relationships": "http://prd-neo4j-01:7474/db/data/node/2427490/relationships/out",
              "labels": "http://prd-neo4j-01:7474/db/data/node/2427490/labels",
              "all_typed_relationships": "http://prd-neo4j-01:7474/db/data/node/2427490/relationships/all/{-list|&|types}",
              "traverse": "http://prd-neo4j-01:7474/db/data/node/2427490/traverse/{returnType}",
              "self": "http://prd-neo4j-01:7474/db/data/node/2427490",
              "property": "http://prd-neo4j-01:7474/db/data/node/2427490/properties/{key}",
              "outgoing_typed_relationships": "http://prd-neo4j-01:7474/db/data/node/2427490/relationships/out/{-list|&|types}",
              "properties": "http://prd-neo4j-01:7474/db/data/node/2427490/properties",
              "incoming_relationships": "http://prd-neo4j-01:7474/db/data/node/2427490/relationships/in",
              "create_relationship": "http://prd-neo4j-01:7474/db/data/node/2427490/relationships",
              "paged_traverse": "http://prd-neo4j-01:7474/db/data/node/2427490/paged/traverse/{returnType}{?pageSize,leaseTime}",
              "all_relationships": "http://prd-neo4j-01:7474/db/data/node/2427490/relationships/all",
              "incoming_typed_relationships": "http://prd-neo4j-01:7474/db/data/node/2427490/relationships/in/{-list|&|types}",
              "metadata": {
                "id": 2427490,
                "labels": [
                  "Login"
                ]
              },
              "data": logins[0]
            }
          ]
        },
        {
          "rest": [
            {
              "outgoing_relationships": "http://prd-neo4j-01:7474/db/data/node/2427339/relationships/out",
              "labels": "http://prd-neo4j-01:7474/db/data/node/2427339/labels",
              "all_typed_relationships": "http://prd-neo4j-01:7474/db/data/node/2427339/relationships/all/{-list|&|types}",
              "traverse": "http://prd-neo4j-01:7474/db/data/node/2427339/traverse/{returnType}",
              "self": "http://prd-neo4j-01:7474/db/data/node/2427339",
              "property": "http://prd-neo4j-01:7474/db/data/node/2427339/properties/{key}",
              "outgoing_typed_relationships": "http://prd-neo4j-01:7474/db/data/node/2427339/relationships/out/{-list|&|types}",
              "properties": "http://prd-neo4j-01:7474/db/data/node/2427339/properties",
              "incoming_relationships": "http://prd-neo4j-01:7474/db/data/node/2427339/relationships/in",
              "create_relationship": "http://prd-neo4j-01:7474/db/data/node/2427339/relationships",
              "paged_traverse": "http://prd-neo4j-01:7474/db/data/node/2427339/paged/traverse/{returnType}{?pageSize,leaseTime}",
              "all_relationships": "http://prd-neo4j-01:7474/db/data/node/2427339/relationships/all",
              "incoming_typed_relationships": "http://prd-neo4j-01:7474/db/data/node/2427339/relationships/in/{-list|&|types}",
              "metadata": {
                "id": 2427339,
                "labels": [
                  "Login"
                ]
              },
              "data": logins[1]
            }
          ]
        }
      ]
    }
  ],
  "errors": []
};
let tabelasOfLoginsResponse = {
  "results": [
    {
      "columns": [
        "id(vFrom)",
        "vFrom.`Identificador`",
        "type(r)",
        "id(vTo)",
        "vTo.`Identificador`"
      ],
      "data": [
        {
          "rest": [
            tabelasDeSistema[0]['fromId'],
            tabelasDeSistema[0]['fromIdentificador'],
            tabelasDeSistema[0]['verb'],
            tabelasDeSistema[0]['toId'],
            tabelasDeSistema[0]['toIdentificador']
          ]
        },
        {
          "rest": [
            tabelasDeSistema[1]['fromId'],
            tabelasDeSistema[1]['fromIdentificador'],
            tabelasDeSistema[1]['verb'],
            tabelasDeSistema[1]['toId'],
            tabelasDeSistema[1]['toIdentificador']
          ]
        }
      ]
    }
  ],
  "errors": []
};
let tabelasResponse = {
  "results": [
    {
      "columns": [
        "v"
      ],
      "data": [
        {
          "rest": [
            {
              "outgoing_relationships": "http://prd-neo4j-01:7474/db/data/node/2430009/relationships/out",
              "labels": "http://prd-neo4j-01:7474/db/data/node/2430009/labels",
              "all_typed_relationships": "http://prd-neo4j-01:7474/db/data/node/2430009/relationships/all/{-list|&|types}",
              "traverse": "http://prd-neo4j-01:7474/db/data/node/2430009/traverse/{returnType}",
              "self": "http://prd-neo4j-01:7474/db/data/node/2430009",
              "property": "http://prd-neo4j-01:7474/db/data/node/2430009/properties/{key}",
              "outgoing_typed_relationships": "http://prd-neo4j-01:7474/db/data/node/2430009/relationships/out/{-list|&|types}",
              "properties": "http://prd-neo4j-01:7474/db/data/node/2430009/properties",
              "incoming_relationships": "http://prd-neo4j-01:7474/db/data/node/2430009/relationships/in",
              "create_relationship": "http://prd-neo4j-01:7474/db/data/node/2430009/relationships",
              "paged_traverse": "http://prd-neo4j-01:7474/db/data/node/2430009/paged/traverse/{returnType}{?pageSize,leaseTime}",
              "all_relationships": "http://prd-neo4j-01:7474/db/data/node/2430009/relationships/all",
              "incoming_typed_relationships": "http://prd-neo4j-01:7474/db/data/node/2430009/relationships/in/{-list|&|types}",
              "metadata": {
                "id": 2430009,
                "labels": [
                  "Tabela"
                ]
              },
              "data": tabelas[0]
            }
          ]
        }
      ]
    }
  ],
  "errors": []
};

let args = {
  data: {
    statements: [
      {
        statement:'',
        parameters:{s:0,l:10000},
        resultDataContents:["REST"]
      }
    ]
  },
  headers:
   { 'Content-Type': 'application/json',
     Authorization: 'test'
   }
 };

let log = (msg) => console.log(msg);
describe('MapaInformacaoConnector', () => {
  before(() => {
    mapaInformacaoConnector = new MapaInformacaoConnector(mapaInformacaoURI, 'test');
  });

  afterEach(() => {
    nock.cleanAll();
  });


  it('should get all sistemas', (done) => {
    // set query for Neo4J
    args.data.statements[0].statement = baseStatements['allSistemas'];

    // set nock interceptor
    let mapaInformacaoMock = nock(mapaInformacaoURI)
                            //.log(log)
                            .post(mapaInformacaoPath, args.data)
                            .reply(200,allSistemasResponse);
    mapaInformacaoConnector.getAllSistemas().then( (results) => {

      mapaInformacaoMock.done();
      results.should.be.ok;
      results.should.be.a('array');
      results.length.should.be.equal(2);
      results.forEach( (result, index) => {
        for (let key in sistemas[index]) {
          result.should.have.property(key);
          expect(result[key]).to.be.ok;
          result[key].should.be.equal(sistemas[index][key]);
        }
        result.should.have.property('id');
        result.id.should.be.equal(sistemasIds[index]);
      } )
      done();
    } ).catch( (error) => done(error) );
  });
  it('should get an error with no sistema name for one sistema', (done) => {
    // set query for Neo4J
    args.data.statements[0].statement = baseStatements['oneSistema'];
    // set nock interceptor
    let mapaInformacaoMock = nock(mapaInformacaoURI)
                            //.log(log)
                            .post(mapaInformacaoPath, args.data)
                            .reply(200,oneSistemaResponse);

    mapaInformacaoConnector.getSistema().then( (results) => {
      done('Invalid name not checked');
    } ).catch( (error) => {
      error.should.be.ok;
      error.should.be.equal('Invalid argument');
      done();
    } );
  });

  it('should get an error with invalid sistema name for one sistema', (done) => {
    // set query for Neo4J
    args.data.statements[0].statement = baseStatements['oneSistema'];
    // set nock interceptor
    let mapaInformacaoMock = nock(mapaInformacaoURI)
                            //.log(log)
                            .post(mapaInformacaoPath, args.data)
                            .reply(200,oneSistemaResponse);

    mapaInformacaoConnector.getSistema('').then( (results) => {
      done('Invalid name not checked');
    } ).catch( (error) => {
      error.should.be.ok;
      error.should.be.equal('Invalid argument');
      done();
    } );
  });

  it('should get only one sistema', (done) => {
    // set query for Neo4J
    args.data.statements[0].statement = baseStatements['oneSistema'];
    // set nock interceptor
    let mapaInformacaoMock = nock(mapaInformacaoURI)
                            //.log(log)
                            .post(mapaInformacaoPath, args.data)
                            .reply(200,oneSistemaResponse);

    mapaInformacaoConnector.getSistema('amse').then( (results) => {
      mapaInformacaoMock.done();
      results.should.be.ok;
      results.should.be.a('array');
      results.length.should.be.equal(1);
      results.forEach( (result, index) => {
        for (let key in sistemas[index]) {
          result.should.have.property(key);
          expect(result[key]).to.be.ok;
          result[key].should.be.equal(sistemas[index][key]);
        }
        result.should.have.property('id');
        result.id.should.be.equal(sistemasIds[index]);
      } )
      done();
    } ).catch( (error) => done(error) );
  });
  it('should get an error with no sistema name for all users a sistema', (done) => {
    // set query for Neo4J
    args.data.statements[0].statement = baseStatements['allSistemaDBUsers'];
    // set nock interceptor
    let mapaInformacaoMock = nock(mapaInformacaoURI)
                            //.log(log)
                            .post(mapaInformacaoPath, args.data)
                            .reply(200,loginsOneSistemaResponse);

    mapaInformacaoConnector.getAllSistemaDbUsers().then( (results) => {
      done('Invalid name not checked');
    } ).catch( (error) => {
      error.should.be.ok;
      error.should.be.equal('Invalid argument');
      done();
    } );
  });
  it('should get an error with invalid sistema name for all users a sistema', (done) => {
    // set query for Neo4J
    args.data.statements[0].statement = baseStatements['allSistemaDBUsers'];
    // set nock interceptor
    let mapaInformacaoMock = nock(mapaInformacaoURI)
                            //.log(log)
                            .post(mapaInformacaoPath, args.data)
                            .reply(200,loginsOneSistemaResponse);

    mapaInformacaoConnector.getAllSistemaDbUsers('').then( (results) => {
      done('Invalid name not checked');
    } ).catch( (error) => {
      error.should.be.ok;
      error.should.be.equal('Invalid argument');
      done();
    } );
  });
  it('should get all users of a sistema', (done) => {
    // set query for Neo4J
    args.data.statements[0].statement = baseStatements['allSistemaDBUsers'];
    // set nock interceptor
    let mapaInformacaoMock = nock(mapaInformacaoURI)
                            //.log(log)
                            .post(mapaInformacaoPath, args.data)
                            .reply(200,loginsOneSistemaResponse);

    mapaInformacaoConnector.getAllSistemaDbUsers('amse').then( (results) => {
      mapaInformacaoMock.done();
      results.should.be.ok;
      results.should.be.a('array');
      results.length.should.be.equal(2);
      results.forEach( (result, index) => {
        for (let key in logins[index]) {
          result.should.have.property(key);
          expect(result[key]).to.be.ok;
          result[key].should.be.equal(logins[index][key]);
        }
        result.should.have.property('id');
        result.id.should.be.equal(loginsIds[index]);
      } )
      done();
    } ).catch( (error) => done(error) );
  });
  it('should get an error with no user list for all tables of users a sistema', (done) => {
    // set query for Neo4J
    args.data.statements[0].statement = baseStatements['allTablesReadBySistema'];
    // set nock interceptor
    let mapaInformacaoMock = nock(mapaInformacaoURI)
                            //.log(log)
                            .post(mapaInformacaoPath, args.data)
                            .reply(200,tabelasOfLoginsResponse);

    mapaInformacaoConnector.getTablesReadByUser().then( (results) => {
      done('no user list not checked');
    } ).catch( (error) => {
      error.should.be.ok;
      error.should.be.equal('Invalid argument');
      done();
    } );
  });
  it('should get an error with invalid user list for all tables of users a sistema', (done) => {
    // set query for Neo4J
    args.data.statements[0].statement = baseStatements['allTablesReadBySistema'];
    // set nock interceptor
    let mapaInformacaoMock = nock(mapaInformacaoURI)
                            //.log(log)
                            .post(mapaInformacaoPath, args.data)
                            .reply(200,tabelasOfLoginsResponse);

    mapaInformacaoConnector.getTablesReadByUser().then( (results) => {
      done('Invalid user list not checked');
    } ).catch( (error) => {
      error.should.be.ok;
      error.should.be.equal('Invalid argument');
      done();
    } );
  });
  it('should get all tables of a list of users', (done) => {
    // set query for Neo4J
    args.data.statements[0].statement = baseStatements['allTablesReadBySistema'];

    // set nock interceptor
    let mapaInformacaoMock = nock(mapaInformacaoURI)
                            //.log(log)
                            .post(mapaInformacaoPath, args.data)
                            .reply(200,tabelasOfLoginsResponse);
    mapaInformacaoConnector.getTablesReadByUser(loginsIds).then( (results) => {

      mapaInformacaoMock.done();
      results.should.be.ok;
      results.should.be.a('array');
      results.length.should.be.equal(2);
      results.forEach( (result, index) => {
        for (let key in tabelasDeSistema[index]) {
          result.should.have.property(key);
          expect(result[key]).to.be.ok;
          result[key].should.be.equal(tabelasDeSistema[index][key]);
        }
      } )
      done();
    } ).catch( (error) => done(error) );
  });
  it('should get an error with no tabela name for tabela details', (done) => {
    // set query for Neo4J
    args.data.statements[0].statement = baseStatements['oneTabela'];
    // set nock interceptor
    let mapaInformacaoMock = nock(mapaInformacaoURI)
                            //.log(log)
                            .post(mapaInformacaoPath, args.data)
                            .reply(200,tabelasResponse);

    mapaInformacaoConnector.getTabela().then( (results) => {
      done('Invalid tabela name not checked');
    } ).catch( (error) => {
      error.should.be.ok;
      error.should.be.equal('Invalid argument');
      done();
    } );
  });

  it('should get an error with invalid tabela name for tabela details', (done) => {
    // set query for Neo4J
    args.data.statements[0].statement = baseStatements['oneTabela'];
    // set nock interceptor
    let mapaInformacaoMock = nock(mapaInformacaoURI)
                            //.log(log)
                            .post(mapaInformacaoPath, args.data)
                            .reply(200,tabelasResponse);

    mapaInformacaoConnector.getTabela('').then( (results) => {
      done('Invalid tabela name not checked');
    } ).catch( (error) => {
      error.should.be.ok;
      error.should.be.equal('Invalid argument');
      done();
    } );
  });

  it('should get only one tabela', (done) => {
    // set query for Neo4J
    args.data.statements[0].statement = baseStatements['oneTabela'];

    // set nock interceptor
    let mapaInformacaoMock = nock(mapaInformacaoURI)
                            //.log(log)
                            .post(mapaInformacaoPath, args.data)
                            .reply(200,tabelasResponse);
    mapaInformacaoConnector.getTabela('informix.bd_tecn.informix.age').then( (results) => {

      mapaInformacaoMock.done();
      results.should.be.ok;
      results.should.be.a('array');
      results.length.should.be.equal(1);
      results.forEach( (result, index) => {
        for (let key in tabelas[index]) {
          result.should.have.property(key);
          expect(result[key]).to.be.ok;
          result[key].should.be.equal(tabelas[index][key]);
        }
        result.should.have.property('id');
        result.id.should.be.equal(tabelasIds[index]);
      } )
      done();
    } ).catch( (error) => done(error) );
  });

});
