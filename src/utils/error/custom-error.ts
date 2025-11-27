export class CustomError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = 'CustomError'
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export class NoDutyError extends CustomError {
  constructor(id: string) {
    super(404, `No duty found with the id: ${id}`)
    this.name = 'NoDutyError'
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export class NoSoldierError extends CustomError {
  constructor(id: string) {
    super(404, `No soldier found with the id: ${id}`)
    this.name = 'NoSoldierError'
    Object.setPrototypeOf(this, new.target.prototype)
  }
}
