const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../../src/app');
const Event = require('../../src/models/Event');

chai.use(chaiHttp);
const { expect } = chai;

describe('Hub API', () => {
  describe('POST /hub', () => {
    it('should register a listener', async () => {
      const res = await chai.request(app)
        .post('/tmf-api/communicationManagement/v4/hub')
        .send({
          callback: 'http://localhost:3000/listener',
          query: 'eventType=CommunicationMessageStateChangeEvent'
        });
      
      expect(res).to.have.status(201);
      expect(res.body).to.have.property('id');
      expect(res.body.callback).to.equal('http://localhost:3000/listener');
    });

    it('should reject registration without callback', async () => {
      const res = await chai.request(app)
        .post('/tmf-api/communicationManagement/v4/hub')
        .send({
          query: 'eventType=CommunicationMessageStateChangeEvent'
        });
      
      expect(res).to.have.status(400);
    });
  });

  describe('DELETE /hub/:id', () => {
    it('should unregister a listener', async () => {
      // First register a listener
      const registerRes = await chai.request(app)
        .post('/tmf-api/communicationManagement/v4/hub')
        .send({
          callback: 'http://localhost:3000/listener'
        });
      
      // Then unregister it
      const res = await chai.request(app)
        .delete(`/tmf-api/communicationManagement/v4/hub/${registerRes.body.id}`);
      
      expect(res).to.have.status(204);
    });
  });
});