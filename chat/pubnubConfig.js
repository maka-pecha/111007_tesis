const PubNub = require('pubnub');

class PubNubInstancePool {
  constructor() {
    this.instances = new Map();
  }

  getInstance(userId) {
    if (!this.instances.has(userId)) {
      const pubnub = new PubNub({
      publishKey: process.env.PUBNUB_PUBLISH_KEY,
      subscribeKey: process.env.PUBNUB_SUBSCRIBE_KEY,
      userId: userId.toString(),  // Add any other configuration options you need
      });
      const listener = {
        status: (statusEvent) => {
            if (statusEvent.category === "PNConnectedCategory") {
                console.log("Connected");
            }
        },
        message: (messageEvent) => {
            console.log("Mensaje",messageEvent.message.description);
        },
        presence: (presenceEvent) => {
            // handle presence
        }
    };
    pubnub.addListener(listener);
      this.instances.set(userId, pubnub);
    }

    return this.instances.get(userId);
  }
}

module.exports = new PubNubInstancePool();







// const PubNub = require('pubnub');

// let pubnubInstance;

// function initializePubNub(userId) {
//   if (!pubnubInstance) {
//     const pubnub = new PubNub({
//       publishKey: process.env.PUBNUB_PUBLISH_KEY,
//       subscribeKey: process.env.PUBNUB_SUBSCRIBE_KEY,
//       userId: userId.toString(), // Set the user ID as the UUID
//     });

//     pubnubInstance = pubnub
//   }

// }

// function getPubnub(){

//   return pubnubInstance;
// }

// module.exports = {initializePubNub,getPubnub};
