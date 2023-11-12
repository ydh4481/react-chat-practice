import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as StompJs from "@stomp/stompjs";
import { useLocation, useParams } from 'react-router-dom';
import axios from 'axios';


const Chat = () => {
  const token = useLocation().state.token;
  const user = useLocation().state.user;
  let { id } = useParams();
  const [content, setContent] = useState([])
  const client = useRef({});
  const partner = useRef("");
  const [ms, setMs] = useState("");

  const _onChange = useCallback(
    (e) => {
      setMs(e.target.value);
    },
    []
  );

  // 초기 WS 연결
  const connect = () => {
    client.current = new StompJs.Client({
      brokerURL: 'ws://localhost:8080/ws',
      connectHeaders: {
        Authentication: `Bearer ${token}`,
        RedisRoomId: id
      },
      debug: (str) => {
        console.log(str)
      },
    })
    // SUB
    client.current.onConnect = () => {
      client.current.subscribe(`/sub/chat/room/${id}`, subCallback, {
        Authentication: `Bearer ${token}`,
        RedisRoomId: id
      })
      // 초기 연결 시 ENTER 메세지 전송
      // 상대방이 들어왔다는 이벤트 전달
      client.current.publish({
        destination: '/pub/chat/message',
        body: JSON.stringify({
          // chatMessageDto
          messageType: 'ENTER',
          redisRoomId: id,
          message: "",
          sender: user.nickName
        }),
        headers: {
          Authentication: `Bearer ${token}`
        }
      })
    }
    client.current.activate();
  }

  const disConnect = () => {
    if (client.current.connected)
      client.current.deactivate();
  }

  // SUB 연결
  const subCallback = (data) => {
    let msg = JSON.parse(data.body);
    console.log('MSG', msg)
    if (msg.messageType === "ENTER") {
      // messageType이 "ENTER"이고, sender가 "나"가 아닐 때
      // 현재 메세지의 readCount 값을 모두 0으로 변경
      // TODO setContent 했을 때 화면에 반영되지 않음. content가 랜더링되지 않음
      if (msg.sender !== user.nickName) {
        let updatedUnreadContent = content.map(c => ({ ...c, readCount: 0 }));
        console.log(updatedUnreadContent)
        setContent(updatedUnreadContent);
      }
    } else {
      console.log('pub', msg.readCount)
      setContent((c) => [...c, msg])
    }
    console.log('read', content)
  }

  // 초기 메세지 불러오기
  const initContents = () => {
    axios.get(`http://localhost:8080/api/chat/rooms/${id}?memberId=${user.userId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }).then((e) => {
      setContent([]);

      console.log('초기 메세지 불러오기', e.data)
      e.data.messages.map((msg) => {
        console.log('초기메세지', msg)
        setContent((c) => [...c, msg])
      })
      partner.current = e.data.receiver === user.nickName ? e.data.sender : e.data.receiver
    }).catch((e) => {
      console.log('error', e)
    })
  }

  useEffect(() => {
    if (!content) return;
    connect();
    initContents()

    return () => disConnect();
  }, []);


  // PUB 메세지 전송
  const handler = (message) => {
    if (!client.current.connected)
      return;
    console.log(user)
    client.current.publish({
      destination: '/pub/chat/message',
      body: JSON.stringify({
        // chatMessageDto
        messageType: 'TALK',
        redisRoomId: id,
        message: message,
        sender: user.nickName
      }),
      headers: {
        Authentication: `Bearer ${token}`
      }
    })
  }
  const messageTemplate = (msg) => {
    if (msg.sender === user.nickName) {
      return (
        <div key={msg.chatMessageId} style={{ marginLeft: '20rem' }}>
          <div>{msg.chatMessageId} {msg.sender} {msg.readCount === 1 ? '안읽음' : '읽음'}</div>
          <div>{msg.message} {dateFormat(msg.createdAt)}</div>
        </div>
      )
    } else {
      return (
        <div key={msg.createdAt}>
          <div>{msg.chatMessageId} {msg.sender} {msg.readCount === 1 ? '안읽음' : '읽음'}</div>
          <div>{msg.message} {dateFormat(msg.createdAt)}</div>
        </div>
      )
    }
  }
  const dateFormat = (date) => {
    date = new Date(date)
    let month = date.getMonth() + 1;
    let day = date.getDate();
    let hour = date.getHours();
    let minute = date.getMinutes();
    let second = date.getSeconds();

    month = month >= 10 ? month : '0' + month;
    day = day >= 10 ? day : '0' + day;
    hour = hour >= 10 ? hour : '0' + hour;
    minute = minute >= 10 ? minute : '0' + minute;
    second = second >= 10 ? second : '0' + second;

    return date.getFullYear() + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second;
  }

  return (
    <div>
      <h3>
        {partner.current || ""} 님과의 채팅
      </h3>
      <div>
        {content && content.map((d) => messageTemplate(d))}

      </div>
      <div style={{ marginTop: '10rem' }}>
        <input
          style={{ width: '30vw' }}
          value={ms}
          onChange={_onChange}
          name={"ms"}
        />
        <button
          type={"button"}
          onClick={() => {
            handler(ms);
            setMs("");
          }}>
          전송
        </button>
      </div>
    </div>
  )
};

export default Chat;