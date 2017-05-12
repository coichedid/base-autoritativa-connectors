import {MapaInformacaoConnector} from '../index';

let mapaInformacaoURI = 'http://prd-neo4j-01:7474';
let mapaInformacaoPath = '/db/data/transaction/commit';
console.log('Running');

let mapaInformacaoConnector = new MapaInformacaoConnector(mapaInformacaoURI, 'Basic bmVvNGo6TWFwYUluZm9ybWFjYW9HaXQyMDE2');

let results = mapaInformacaoConnector.getAllSistemas();
results.then((data) => console.log(data));
