const Place = require('../models/place');
const PubNub = require('../chat/pubnubConfig');
const { getChat } = require('../utils/chat')
const User = require('../models/user')

module.exports.index = async (req, res) => {
    const places = await Place.find({}).populate('popupText');
    res.render('places/index', { places })
}

module.exports.renderNewForm = (req, res) => {
    res.render('places/new');
}

module.exports.message = async (req, res) => {
    const pubnubInstance = PubNub.getInstance(req.user._id)
    const pageId = req.params.id
    // const channel = `users.${req.params.id}.${req.user._id}`

    // Event handler for PubNub message

    const channel = "user"
    let msg = req.body.message
    try {
        pubnubInstance.subscribe({
            channels: [channel],
            withPresence: true, // Set to true if you want to receive presence events as well
          });
          console.log("Subscribed!")
    } catch (error) {
        console.log(error)
    }

    const subscribedChannels = pubnubInstance.getSubscribedChannels();

    console.log(req.body.message)
    console.log(subscribedChannels)

    const publishPayload = {
        channel : channel,
        message: {
            title: "message",
            description: msg
        }
    };
    const status = await pubnubInstance.publish(publishPayload);
    res.redirect('./');
}

module.exports.showChat = async (req, res) => {
    const pubnubInstance = PubNub.getInstance(req.user._id);
    const subscribedChannels = pubnubInstance.getSubscribedChannels();
    const id = subscribedChannels[subscribedChannels.length -1 ].split('.')[1];
    const chats = await getChat(pubnubInstance,'user')
    const messages = []
    if (chats) {
        for (let chat of chats){
            const user = await User.findById(chat.uuid);
            const username = user ? user.username : 'Unknown User';
            const message = chat.message.description;
            const timestamp = chat.timetoken / 10000;
            const date = new Date(timestamp).toLocaleString();
            const image = user?.image;
            messages.push({ user: username, image, message, date })
        }
    }
    res.render('chat/show',{ id, messages });
}

module.exports.getMes = async (req, res) => {
    const pubnubInstance = PubNub.getInstance('646cbc486b7c862ab8b9cbaf')
    // const pubnubInstance = PubNub.getInstance(req.user._id)
    const chats = await getChat(pubnubInstance,'users')
    const messages = []
    for (let chat of chats){
        const user = await User.findById(chat.uuid);
        const username = user.username
        const message = chat.message.description
        messages.push({user:username,message:message})
    }
    console.log(messages)
    const data = {id:id,messages:messages,pubnubInstance:pubnubInstance}
    res.json(JSON.stringify(data));
}
