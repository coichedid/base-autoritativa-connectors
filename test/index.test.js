import chai from 'chai';
import MapaInformacao from '../src/connectors/MapaInformacaoConnector';
import baseAutoritativaConnectors from '../src/index';
import {MapaInformacaoConnector} from '../src/index';

let should = chai.should();

describe('base-autoritativa-connectors', () => {
  before(() => {

  });

  afterEach(() => {

  });


  it('should export all connectors', (done) => {
    baseAutoritativaConnectors.should.be.ok;
    Object.keys(baseAutoritativaConnectors).length.should.be.equal(1);
    baseAutoritativaConnectors['MapaInformacaoConnector'].should.be.equal(MapaInformacao);
    done();
  });

  it('should export MapaInformacaoConnector', (done) => {
    MapaInformacaoConnector.should.be.ok;
    MapaInformacaoConnector.should.be.equal(MapaInformacao);
    done();
  });
});
