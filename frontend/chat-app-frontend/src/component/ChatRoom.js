import React, { useState } from "react";
import { over } from "stompjs";
import SockJS from "sockjs-client";

let stompClient = null;
const ChatRoom = () => {
  const [userData, setUserData] = useState({
    userName: "",
    receiverName: "",
    connected: false,
    message: "",
  });

  const [privateChat, setPrivateChat] = useState(new Map());

  const [publicChat, setPublicChat] = useState([]);

  const [tab, setTab] = useState("CHATROOM");
  const handleUserName = (e) => {
    setUserData({
      ...userData,
      "userName": e.target.value,
    });
  };

  const registerUser = () => {
    let Sock = new SockJS("http://localhost:8080/ws");
    stompClient = over(Sock);
    stompClient.connect({}, onConnected, onError);
  };

  const onConnected = () => {
    setUserData({ ...userData, connected: true });
    stompClient.subscribe("/chatroom/public", onPublicMessageReceived);
    stompClient.subscribe(
      "/user" + userData.userName + "/private",
      onPrivateMessageReceived
    );
    userJoin();
  };

const userJoin=()=>{
  
        let chatMessage={
            senderName:userData.userName,
            status:'JOIN'
        };
        stompClient.send('/app/message',{},JSON.stringify(chatMessage))
      
    
}


  const onError = (err) => {
    console.log(err);
  };
  const onPublicMessageReceived = (payload) => {
    let payloadData = JSON.parse(payload.body);
    switch (payload.status) {
      case "JOIN":
        if (privateChat.get(payloadData.senderName)) {
          privateChat.set(payloadData.senderName, []);
          setPrivateChat(new Map(privateChat));
        }
        break;
      case "MESSAGE":
        publicChat.push(payloadData);
        setPublicChat([...publicChat]);
        break;
    }
  };

  const onPrivateMessageReceived = (payload) => {
    let payloadData = JSON.parse(payload);
    if (privateChat.get(payloadData.senderName)) {
      privateChat.get(payloadData.senderName).push(payloadData);
      setPrivateChat(new Map(privateChat));
    } else {
      let list = [];
      list.push(payloadData);
      privateChat.set(payloadData.senderName, list);
      setPrivateChat(new Map(privateChat));
    }
  };

  const handleMessage = (e) => {
    setUserData({
      ...userData,
      "message": e.target.value,
    });
  };

const sendPublicMessage=()=>{
    if(stompClient){
        let chatMessage={
            senderName:userData.userName,
            message:userData.message,
            status:'MESSAGE'
        };
        stompClient.send('/app/message',{},JSON.stringify(chatMessage))
        setUserData({...userData,"message":""})
    }
}
const sendPrivateMessage=()=>{
    if(stompClient){
        let chatMessage={
            senderName:userData.userName,
            receiverName:tab,
            message:userData.message,
            status:'MESSAGE'
        };
        if(userData.userName !== tab){
            privateChat.set(tab).push(chatMessage)
            setPrivateChat(new Map(privateChat))
        }
        stompClient.send('/app/private-message',{},JSON.stringify(chatMessage))
        setUserData({...userData,"message":""})
    }
}

  return (
    <div className="container">
      {userData.conneced ? (
        <div className="chat-box">
          <div className="member-list">
            <ul>
              <li
                onClick={() => {
                  setTab("CHATROOM");
                }}
                className={`member ${tab === "CHATROOM" && "active"}`}
              >
                Chatroom
              </li>
              {[...privateChat.keys()].map((name, index) => {
                <li
                  onClick={() => {
                    setTab(name);
                  }}
                  className={`member ${tab === "CHATROOM" && "active"}`}
                  key={index}
                >
                  {name}
                </li>;
              })}
            </ul>
          </div>
          {tab === "CHATROOM" && (
            <div className="chat-content">
              <ul className="chat-message">
                {publicChat.map((chat, index) => {
                  <li className="member" key={index}>
                    {chat.senderName !== userData.userName && (
                      <div className="avatar">{chat.senderName}</div>
                    )}
                    <div className="message-data">{chat.message}</div>
                    {chat.senderName === userData.userName && (
                      <div className="avatar self">{chat.senderName}</div>
                    )}
                  </li>;
                })}
              </ul>
              <div className="send message">
                <input
                  type="text"
                  className="input-message"
                  placeholder="enter a public message"
                  value={userData.message}
                  onChange={handleMessage}
                />
                <button
                  type="button"
                  className="send-button"
                  onClick={sendPublicMessage}
                ></button>
              </div>
            </div>
          )}
          {tab !== "CHATROOM" && (
            <div className="chat-content">
              <ul className="chat-message">
                {[...privateChat.get(tab)].map((chat, index) => {
                  <li className="member" key={index}>
                    {chat.senderName !== userData.userName && (
                      <div className="avatar">{chat.senderName}</div>
                    )}
                    <div className="message-data">{chat.message}</div>
                    {chat.senderName === userData.userName && (
                      <div className="avatar self">{chat.senderName}</div>
                    )}
                  </li>;
                })}
              </ul>
              <div className="send message">
                <input
                  type="text"
                  className="input-message"
                  placeholder={`enter private message for ${tab}`}
                  value={userData.message}
                  onChange={handleMessage}
                />
                <button
                  type="button"
                  className="send-button"
                  onClick={sendPrivateMessage}
                ></button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="register">
          <input
            id="user-name"
            placeholder="Enter the user name"
            value={userData.userName}
            onChange={handleUserName}
          />
          <button type="button" onClick={registerUser}>connect</button>
        </div>
      )}
    </div>
  );
};

export default ChatRoom;
