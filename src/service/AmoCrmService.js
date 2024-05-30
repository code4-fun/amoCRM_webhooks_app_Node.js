import 'dotenv/config'
import axios from 'axios'

class AmoCrmService {
  constructor() {
    const {LONG_TERM_TOKEN, BASE_URL} = process.env;
    this.longTermToken = LONG_TERM_TOKEN
    this.baseUrl = BASE_URL

    this.authHeader = {
      'Authorization': `Bearer ${this.longTermToken}`
    }

    this.api = axios.create({
      baseURL: this.baseUrl,
      headers: this.authHeader
    });
  }

  async fetchAndProcessCustomFieldsEnums() {
    const response = await this.api(`${this.baseUrl}/api/v4/contacts/custom_fields`);
    const enumValues = response.data._embedded.custom_fields.flatMap(i => i.enums ? i.enums.map(v => ({
      id: v.id,
      value: v.value
    })) : []);
    let result = {}
    enumValues.forEach(i => {
      if(i.value === 'WORK'){
        result[i.id] = 'рабочий'
      } else if(i.value === 'WORKDD'){
        result[i.id] = 'рабочий прямой'
      } else if(i.value === 'MOB'){
        result[i.id] = 'мобильный'
      } else if(i.value === 'FAX'){
        result[i.id] = 'факс'
      } else if(i.value === 'HOME'){
        result[i.id] = 'домашний'
      } else if(i.value === 'OTHER'){
        result[i.id] = 'другой'
      } else if(i.value === 'PRIV'){
        result[i.id] = 'частный'
      }
    })
    return result
  }

  async fetchAndProcessStatuses(pipelineId){
    const response = await this.api(`${this.baseUrl}/ajax/v1/pipelines/list`, {
      headers: {
        'X-Requested-With':'XMLHttpRequest',
      }
    });
    const statuses = response.data.response.pipelines[pipelineId].statuses
    let result = {}
    for(let status in statuses){
      result[statuses[status].id] = statuses[status].name
    }
    return result
  }

  async processCustomFields(customFields){
    let result = ''
    const enumValues = await this.fetchAndProcessCustomFieldsEnums()
    customFields.forEach(i => {
      i.values.forEach(j => {
        let fieldDetails = enumValues[j.enum] !== undefined ? ' ' + enumValues[j.enum] : ''
        result += i.name + '' + fieldDetails + ': ' + j.value + ', '
      })
    })
    return result
  }

  getTimeFromUnix(unixTime) {
    const date = new Date(unixTime * 1000);

    const hours = date.getUTCHours() + 3;
    const minutes = date.getUTCMinutes();
    const seconds = date.getUTCSeconds();

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  async createContactNote(data){
    const responsible = await this.fetchUser(data.responsible_user_id)
    const noteText = `Контакт создан: Имя: ${data.name}, Ответственный: ${responsible.name}, Время создания: ${this.getTimeFromUnix(data.date_create)}`
    await this.sendNote('contacts', data.id, JSON.stringify(noteText))
  }

  async updateContactNote(data){
    const customFields = data.custom_fields !== undefined ? await this.processCustomFields(data.custom_fields) : null
    const responsible = await this.fetchUser(data.responsible_user_id)
    let noteText = 'Контакт изменен. Обновленные поля контакта:'
    noteText += ` Имя: ${data.name},`
    noteText += ` Ответственный: ${responsible.name},`
    noteText += customFields ? ` ${customFields}` : ''
    noteText += ` Время изменения контакта: ${this.getTimeFromUnix(data.updated_at)}`
    await this.sendNote('contacts', data.id, JSON.stringify(noteText))
  }

  async createLeadNote(data) {
    const responsible = await this.fetchUser(data.responsible_user_id)
    const noteText = `Создана сделка: Название: ${data.name}, Ответственный: ${responsible.name}, Время создания: ${this.getTimeFromUnix(data.date_create)}`
    await this.sendNote('leads', data.id, JSON.stringify(noteText))
  }

  async updateLeadNote(data){
    const statuses = await this.fetchAndProcessStatuses(data.pipeline_id)
    const responsible = await this.fetchUser(data.responsible_user_id)
    let noteText = 'Сделка изменена. Обновленные поля сделки:'
    noteText += ` Название: ${data.name},`
    noteText += ` Ответственный: ${responsible.name},`
    noteText += ` Статус: ${statuses[data.status_id]},`
    noteText += data.old_status_id !== undefined ? ` Предыдущий статус: ${statuses[data.old_status_id]},` : ''
    noteText += ` Бюджет: ${data.price}`
    noteText += ` Время изменения сделки: ${this.getTimeFromUnix(data.updated_at)}`
    await this.sendNote('leads', data.id, JSON.stringify(noteText))
  }

  async fetchUser(userId) {
    const response = await this.api(`${this.baseUrl}/api/v4/users/${userId}`);
    return await response.data
  }

  async sendNote(entityType, entityId, noteText) {
    const response = await this.api(`${this.baseUrl}/api/v4/${entityType}/${entityId}/notes`, {
      method: 'post',
      data: [{
        note_type: 'common',
        params: {
          text: noteText,
        },
      }]
    });
    const id = response.data._embedded?.notes[0]?.id
    console.log('Note created:', id);
  }
}

export default new AmoCrmService()
