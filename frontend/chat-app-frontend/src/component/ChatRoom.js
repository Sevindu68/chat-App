import React, { useState } from "react";
import { over } from "stompjs";
import SockJS from "sockjs-client";
import { FaUserCircle } from "react-icons/fa";
import { RiChatSmile3Line } from "react-icons/ri";



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
      userName: e.target.value,
    });
  };

  const registerUser = () => {
    let Sock = new SockJS("http://localhost:8080/ws");
    stompClient = over(Sock);
    stompClient.connect({}, onConnected, onError);
  };

  const onConnected = () => {
    setUserData((prevData) => ({ ...prevData, connected: true }));
    stompClient.subscribe("/chatroom/public", onPublicMessageReceived);
    stompClient.subscribe(
      "/user/" + userData.userName + "/private",
      onPrivateMessageReceived
    );
    userJoin();
  };

  const userJoin = () => {
    let chatMessage = {
      senderName: userData.userName,
      status: 'JOIN'
    };
    stompClient.send('/app/message', {}, JSON.stringify(chatMessage));
  };

  const onError = (err) => {
    console.log(err);
  };

  const onPublicMessageReceived = (payload) => {
    let payloadData = JSON.parse(payload.body);
    switch (payloadData.status) {
      case "JOIN":
        if (!privateChat.get(payloadData.senderName)) {
          privateChat.set(payloadData.senderName, []);
          setPrivateChat(new Map(privateChat));
        }
        break;
      case "MESSAGE":
        publicChat.push(payloadData);
        setPublicChat([...publicChat]);
        break;
      default:
        break;
    }
  };

  const onPrivateMessageReceived = (payload) => {
    let payloadData = JSON.parse(payload.body);
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
      message: e.target.value,
    });
  };

  const sendPublicMessage = () => {
    if (stompClient) {
      let chatMessage = {
        senderName: userData.userName,
        message: userData.message,
        status: 'MESSAGE'
      };
      stompClient.send('/app/message', {}, JSON.stringify(chatMessage));
      setUserData({ ...userData, message: "" });
    }
  };

  const sendPrivateMessage = () => {
    if (stompClient) {
      let chatMessage = {
        senderName: userData.userName,
        receiverName: tab,
        message: userData.message,
        status: 'MESSAGE'
      };
      if (privateChat.get(tab)) {
        privateChat.get(tab).push(chatMessage);
        setPrivateChat(new Map(privateChat));
      }
      stompClient.send('/app/private-message', {}, JSON.stringify(chatMessage));
      setUserData({ ...userData, message: "" });
    }
  };

  return (
    <div className="container">
       
      {userData.connected ? (
        
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
              {[...privateChat.keys()].map((name, index) => (
                <li
                  onClick={() => {
                    setTab(name);
                  }}
                  className={`member ${tab === name && "active"}`}
                  key={index}
                >
                 <FaUserCircle /> {name}
                </li>
              ))}
            </ul>
          </div>
          {tab === "CHATROOM" && (
            <div className="chat-content">
              <ul className="chat-message">
                {publicChat.map((chat, index) => (
                  <li className="member" key={index}>
                    {chat.senderName !== userData.userName && (
                      <div className="avatar">{chat.senderName}</div>
                    )}
                    <div className="message-data">{chat.message}</div>
                    {chat.senderName === userData.userName && (
                      <div className="avatar self">{chat.senderName}</div>
                    )}
                  </li>
                ))}
              </ul>
              <div className="send-message">
                <input
                  type="text"
                  className="input-message"
                  placeholder="Enter a public message"
                  value={userData.message}
                  onChange={handleMessage}
                />
                <button
                  type="button"
                  className="send-button"
                  onClick={sendPublicMessage}
                >
                  Send
                </button>
              </div>
            </div>
          )}
          {tab !== "CHATROOM" && (
            <div className="chat-content">
              <ul className="chat-message">
                {[...privateChat.get(tab)].map((chat, index) => (
                  <li className="member" key={index}>
                    {chat.senderName !== userData.userName && (
                      <div className="avatar">{chat.senderName}</div>
                    )}
                    <div className="message-data">{chat.message}</div>
                    {chat.senderName === userData.userName && (
                      <div className="avatar self">{chat.senderName}</div>
                    )}
                  </li>
                ))}
              </ul>
              <div className="send-message">
                <input
                  type="text"
                  className="input-message"
                  placeholder={`Enter private message for ${tab}`}
                  value={userData.message}
                  onChange={handleMessage}
                />
                <button
                  type="button"
                  className="send-button"
                  onClick={sendPrivateMessage}
                >
                  Send
                </button>
              </div>
            </div>
          )}
        </div>
      ) : ( <div>
        <h1 className="topic"><RiChatSmile3Line className="icon" />WELCOME TO CHATTY</h1>
        <div className="register">
           
          <input
            id="user-name"
            placeholder="Enter the user name"
            value={userData.userName}
            onChange={handleUserName}
          />
          <button type="button" onClick={registerUser}>
            Connect
          </button>
        </div>
      </div>
        
      )}
    </div>
  );
};

export default ChatRoom;
