import chai from 'chai';
import MapaInformacao from '../src/connectors/MapaInformacaoConnector';
import MediaWiki from '../src/connectors/MediaWikiConnector';
import baseAutoritativaConnectors from '../src/index';
import {MapaInformacaoConnector, MediaWikiConnector} from '../src/index';

let should = chai.should();

describe('base-autoritativa-connectors', () => {
  before(() => {

  });

  afterEach(() => {

  });


  it('should export all connectors', (done) => {
    baseAutoritativaConnectors.should.be.ok;
    Object.keys(baseAutoritativaConnectors).length.should.be.equal(2);
    baseAutoritativaConnectors['MapaInformacaoConnector'].should.be.equal(MapaInformacao);
    baseAutoritativaConnectors['MediaWikiConnector'].should.be.equal(MediaWiki);
    done();
  });

  it('should export MapaInformacaoConnector', (done) => {
    MapaInformacaoConnector.should.be.ok;
    MapaInformacaoConnector.should.be.equal(MapaInformacao);
    done();
  });

  it('should export MediaWikiConnector', (done) => {
    MediaWikiConnector.should.be.ok;
    MediaWikiConnector.should.be.equal(MediaWiki);
    done();
  });

});
