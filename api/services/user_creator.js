const pick = require('@/lib/pick')
const User = require('@/models/user')

class UserCreator {
  constructor({ data, transaction = null }) {
    this.data = pick(data, ['email'])
    this.transaction = transaction
  }

  createWithTransaction() {
    return User.transaction(async (transaction) => {
      this.transaction = transaction

      const create = await this.create()

      this.transaction = null

      return create
    })
  }

  create() {
    if (!this.transaction) {
      return this.createWithTransaction()
    }

    return User.findOneOrInsert(this.data, null, this.transaction)
  }
}

module.exports = UserCreator
