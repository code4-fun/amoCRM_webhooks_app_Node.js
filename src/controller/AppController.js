import AmoCrmService from "../service/AmoCrmService.js"

class AppController {
  async processWebhooks(req, res) {
    try {
      if (req.body?.contacts) {
        if (req.body?.contacts?.add && req.body.contacts.add.length > 0) {
          await AmoCrmService.createContactNote(req.body.contacts.add[0])
        } else if (req.body?.contacts?.update && req.body.contacts.update.length > 0) {
          await AmoCrmService.updateContactNote(req.body.contacts.update[0])
        }
      } else if (req.body.leads) {
        if (req.body?.leads?.add && req.body.leads.add.length > 0) {
          await AmoCrmService.createLeadNote(req.body.leads.add[0])
        } else if (req.body?.leads?.update && req.body.leads.update.length > 0) {
          await AmoCrmService.updateLeadNote(req.body.leads.update[0])
        }
      }
      res.status(200).json('success');
    } catch (e) {
      console.log(e)
      res.status(500).json(e)
    }
  }
}

export default new AppController()
