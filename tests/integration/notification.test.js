const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../../src/app');
const Event = require('../../src/models/Event');
const CommunicationMessage = require('../../src/models/CommunicationMessage');

chai.use(chaiHttp);
const { expect } = chai;

describe('Notification API', () => {
  let testMessage;

  beforeEach(async () => {
    await Event.deleteMany({});
    testMessage = await new CommunicationMessage({
      content: "Test message",
      messageType: "SMS",
      receiver: [{ phoneNumber: "+1234567890" }],
      sender: { phoneNumber: "+9876543210" }
    }).save();
  });

  describe('POST /notification/state-change', () => {
    it('should publish a state change event', async () => {
      const res = await chai.request(app)
        .post('/tmf-api/communicationManagement/v4/notification/state-change')
        .send({
          communicationMessage: {
            id: testMessage.id,
            state: "completed"
          },
          eventType: "CommunicationMessageStateChangeEvent"
        });
      
      expect(res).to.have.status(201);
      expect(res.body.eventType).to.equal('CommunicationMessageStateChangeEvent');
      
      // Verify event was stored
      const event = await Event.findOne({ eventType: 'CommunicationMessageStateChangeEvent' });
      expect(event).to.exist;
    });
  });

  describe('POST /notification/attribute-change', () => {
    it('should publish an attribute change event', async () => {
      const res = await chai.request(app)
        .post('/tmf-api/communicationManagement/v4/notification/attribute-change')
        .send({
          communicationMessage: {
            id: testMessage.id,
            content: "Updated content"
          },
          changedAttributes: {
            content: {
              oldValue: "Test message",
              newValue: "Updated content"
            }
          },
          eventType: "CommunicationMessageAttributeValueChangeEvent"
        });
      
      expect(res).to.have.status(201);
      expect(res.body.eventType).to.equal('CommunicationMessageAttributeValueChangeEvent');
      
      // Verify event was stored
      const event = await Event.findOne({ eventType: 'CommunicationMessageAttributeValueChangeEvent' });
      expect(event).to.exist;
    });
  });
});