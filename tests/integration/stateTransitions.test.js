const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../../src/app');
const CommunicationMessage = require('../../src/models/CommunicationMessage');
const stateMachineService = require('../../src/services/stateMachineService');

chai.use(chaiHttp);
const { expect } = chai;

describe('State Transitions', () => {
  let message;

  beforeEach(async () => {
    await CommunicationMessage.deleteMany({});
    message = await new CommunicationMessage({
      content: "Test message",
      messageType: "SMS",
      receiver: [{ phoneNumber: "+1234567890" }],
      sender: { phoneNumber: "+9876543210" },
      state: "initial"
    }).save();
  });

  describe('Valid Transitions', () => {
    it('should allow initial → inProgress', async () => {
      const res = await chai.request(app)
        .patch(`/tmf-api/communicationManagement/v4/communicationMessage/${message.id}`)
        .send({ state: 'inProgress' });
      
      expect(res).to.have.status(200);
      expect(res.body.state).to.equal('inProgress');
    });

    it('should allow initial → cancelled', async () => {
      const res = await chai.request(app)
        .patch(`/tmf-api/communicationManagement/v4/communicationMessage/${message.id}`)
        .send({ state: 'cancelled' });
      
      expect(res).to.have.status(200);
      expect(res.body.state).to.equal('cancelled');
    });

    it('should allow inProgress → completed', async () => {
      message.state = 'inProgress';
      await message.save();
      
      const res = await chai.request(app)
        .patch(`/tmf-api/communicationManagement/v4/communicationMessage/${message.id}`)
        .send({ state: 'completed' });
      
      expect(res).to.have.status(200);
      expect(res.body.state).to.equal('completed');
    });

    it('should allow failed → inProgress', async () => {
      message.state = 'failed';
      await message.save();
      
      const res = await chai.request(app)
        .patch(`/tmf-api/communicationManagement/v4/communicationMessage/${message.id}`)
        .send({ state: 'inProgress' });
      
      expect(res).to.have.status(200);
      expect(res.body.state).to.equal('inProgress');
    });
  });

  describe('Invalid Transitions', () => {
    it('should reject initial → completed', async () => {
      const res = await chai.request(app)
        .patch(`/tmf-api/communicationManagement/v4/communicationMessage/${message.id}`)
        .send({ state: 'completed' });
      
      expect(res).to.have.status(400);
    });

    it('should reject completed → inProgress', async () => {
      message.state = 'completed';
      await message.save();
      
      const res = await chai.request(app)
        .patch(`/tmf-api/communicationManagement/v4/communicationMessage/${message.id}`)
        .send({ state: 'inProgress' });
      
      expect(res).to.have.status(400);
    });

    it('should reject cancelled → inProgress', async () => {
      message.state = 'cancelled';
      await message.save();
      
      const res = await chai.request(app)
        .patch(`/tmf-api/communicationManagement/v4/communicationMessage/${message.id}`)
        .send({ state: 'inProgress' });
      
      expect(res).to.have.status(400);
    });
  });
});