const Place = require('../models/place');
const PubNub = require('../chat/pubnubConfig');
const { getChat } = require('../utils/chat')
const User = require('../models/user')

module.exports.message = async (req, res) => {
    const pubnubInstance = PubNub.getInstance(req.user._id)
    // Event handler for PubNub message
    const channel = "user"
    let msg = req.body.message
    try {
        pubnubInstance.subscribe({
            channels: [channel],
            withPresence: true, // Set to true if you want to receive presence events as well
          });
    } catch (error) {
        req.flash('error', 'Message can´t be send');
        res.status(400).send();
    }

    pubnubInstance.getSubscribedChannels();
    const publishPayload = {
        channel : channel,
        message: {
            title: "message",
            description: msg
        }
    };
    await pubnubInstance.publish(publishPayload);
    res.status(204).send();
}

module.exports.showGlobalChat = async (req, res) => {
    const pubnubInstance = PubNub.getInstance(req.user._id.toString());
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
    res.render('chat/show',{ messages });
}

module.exports.showChat = async (req, res) => {
    const user = req.user
    const id_place = req.params.id_place.toString();
    const id = req.params.id.toString();
    const place = await Place.findById(id_place);

    const channel = `users.${id_place}.${id}`

    const pubnubInstance = PubNub.getInstance(user._id.toString())
    const chats = await getChat(pubnubInstance,channel)
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
    res.render('chat/private_chat',{ id, messages, id_place, place });
}

module.exports.showPlaceChats = async (req, res) => {
    const id_place = req.params.id_place.toString()
    const place = await Place.findById(id_place)
    const subs = place.subscribers || [];
    const users = []

    for(let sub of subs){
        users.push(await User.findById(sub))
    }
    res.render('chat/index',{ users, id_place });
}

module.exports.getMes = async (req, res) => {
    const user = req.user
    const id_place = req.params.id_place.toString()
    const id = req.params.id.toString()

    const channel = `users.${id_place}.${id}`
    const pubnubInstance = PubNub.getInstance(user._id.toString())
    const chats = await getChat(pubnubInstance,channel) || []
    const messages = []
    for (let chat of chats){
        const user = await User.findById(chat.uuid);
        const username = user.username
        const message = chat.message.description
        messages.push({user:username,message:message})
    }
    const data = { id:id,messages:messages, pubnubInstance:pubnubInstance }
    res.json(JSON.stringify(data));
}

module.exports.testPost = async (req, res) => {
    const user = req.user
    const id_place = req.params.id_place.toString()
    const id = req.params.id.toString()
    const pubnubInstance = PubNub.getInstance(req.user._id)
    const msg = req.body.message
    const channel = `users.${id_place}.${id}`

    const publishPayload = {
        channel : channel,
        message: {
            title: "message",
            description: msg
        }
    };

    await pubnubInstance.publish(publishPayload);
    const date = new Date().toLocaleString();
    req.io.emit(channel,{
        user: user.username,
        image: user.image,
        message: msg,
        date,
    })
    res.status(204).send();
}
