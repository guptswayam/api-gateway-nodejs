class LeakyBucketQueue {
  constructor(size) {
    this.queue = []
    this.bucketSize = size
  }

  removeData() {
    this.queue.shift()
  }

  addData() {
    if(this.queue.length === this.bucketSize)
      return false
    
    this.queue.push(true)

    return true
    
  }
}

class LeakyBucketRateLimiter{

  constructor(size) {
    this.userBucket = new Map()
    this.userBucketSize = size
  }

  grantAccess(userIdOrIp) {
    if(!this.userBucket.has(userIdOrIp)) {
      this.userBucket.set(userIdOrIp, new LeakyBucketQueue(this.userBucketSize))
    }

    return this.userBucket.get(userIdOrIp).addData()

  }

  removeRequest(userIdOrIp) {
    this.userBucket.get(userIdOrIp).removeData();
  }
}

module.exports = {
  LeakyBucketRateLimiter
}