const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../../src/app');
const CommunicationMessage = require('../../src/models/CommunicationMessage');
const validMessages = require('../ctk-mocks/validMessages.json');
const invalidMessages = require('../ctk-mocks/invalidMessages.json');

chai.use(chaiHttp);
const { expect } = chai;

describe('Communication Message API', () => {
  beforeEach(async () => {
    await CommunicationMessage.deleteMany({});
  });

  describe('POST /communicationMessage', () => {
    validMessages.forEach((testCase) => {
      it(`should create a message: ${testCase.description}`, async () => {
        const res = await chai.request(app)
          .post('/tmf-api/communicationManagement/v4/communicationMessage')
          .send(testCase.message);
        
        expect(res).to.have.status(201);
        expect(res.body).to.have.property('id');
        expect(res.body.content).to.equal(testCase.message.content);
        expect(res.body.messageType).to.equal(testCase.message.messageType);
      });
    });

    invalidMessages.forEach((testCase) => {
      it(`should reject invalid message: ${testCase.description}`, async () => {
        const res = await chai.request(app)
          .post('/tmf-api/communicationManagement/v4/communicationMessage')
          .send(testCase.message);
        
        expect(res).to.have.status(400);
        expect(res.body.message).to.include(testCase.expectedError);
      });
    });
  });

  describe('GET /communicationMessage', () => {
    it('should list all messages', async () => {
      // Create test messages
      await Promise.all(validMessages.map(msg => 
        new CommunicationMessage(msg.message).save()
      ));

      const res = await chai.request(app)
        .get('/tmf-api/communicationManagement/v4/communicationMessage');
      
      expect(res).to.have.status(200);
      expect(res.body).to.be.an('array');
      expect(res.body.length).to.equal(validMessages.length);
    });

    it('should filter messages by state', async () => {
      // Create messages with different states
      await new CommunicationMessage({
        ...validMessages[0].message,
        state: 'initial'
      }).save();
      
      await new CommunicationMessage({
        ...validMessages[1].message,
        state: 'completed'
      }).save();

      const res = await chai.request(app)
        .get('/tmf-api/communicationManagement/v4/communicationMessage?state=completed');
      
      expect(res).to.have.status(200);
      expect(res.body).to.be.an('array');
      expect(res.body.length).to.equal(1);
      expect(res.body[0].state).to.equal('completed');
    });
  });

  describe('GET /communicationMessage/:id', () => {
    it('should retrieve a message by ID', async () => {
      const msg = await new CommunicationMessage(validMessages[0].message).save();
      
      const res = await chai.request(app)
        .get(`/tmf-api/communicationManagement/v4/communicationMessage/${msg.id}`);
      
      expect(res).to.have.status(200);
      expect(res.body.id).to.equal(msg.id);
      expect(res.body.content).to.equal(msg.content);
    });

    it('should return 404 for non-existent message', async () => {
      const res = await chai.request(app)
        .get('/tmf-api/communicationManagement/v4/communicationMessage/nonexistent');
      
      expect(res).to.have.status(404);
    });
  });

  describe('PATCH /communicationMessage/:id', () => {
    it('should update a message', async () => {
      const msg = await new CommunicationMessage(validMessages[0].message).save();
      
      const res = await chai.request(app)
        .patch(`/tmf-api/communicationManagement/v4/communicationMessage/${msg.id}`)
        .send({ state: 'inProgress' });
      
      expect(res).to.have.status(200);
      expect(res.body.state).to.equal('inProgress');
    });

    it('should reject invalid updates', async () => {
      const msg = await new CommunicationMessage(validMessages[0].message).save();
      
      const res = await chai.request(app)
        .patch(`/tmf-api/communicationManagement/v4/communicationMessage/${msg.id}`)
        .send({ messageType: 'InvalidType' });
      
      expect(res).to.have.status(400);
    });
  });

  describe('DELETE /communicationMessage/:id', () => {
    it('should delete a message', async () => {
      const msg = await new CommunicationMessage(validMessages[0].message).save();
      
      const res = await chai.request(app)
        .delete(`/tmf-api/communicationManagement/v4/communicationMessage/${msg.id}`);
      
      expect(res).to.have.status(204);
      
      // Verify deletion
      const deletedMsg = await CommunicationMessage.findById(msg.id);
      expect(deletedMsg).to.be.null;
    });
  });
});