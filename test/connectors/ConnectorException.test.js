import chai from 'chai';
import ConnectorException from '../../src/connectors/ConnectorException';

let should = chai.should();

describe('base-autoritativa-connectors', () => {
  before(() => {

  });

  afterEach(() => {

  });


  it('should set correct exception', () => {
    let connectorException = new ConnectorException('Error');
    connectorException.name.should.be.equal('ConnectorException');
    connectorException.message.should.be.equal('Error');
  });
});
