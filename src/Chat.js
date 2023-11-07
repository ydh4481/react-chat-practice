import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as StompJs from "@stomp/stompjs";
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useLocation } from 'react-router-dom';

const Chat = () => {
  const token = useLocation().state.token;
  const user = useLocation().state.user;
  let { id } = useParams();
  const [content, setContent] = useState([]);
  const client = useRef({});
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
        Authentication: `Bearer ${token}`
      },
      debug: (str) => {
        console.log(str)
      },
    })
    // SUB
    client.current.onConnect = () => {
      client.current.subscribe(`/sub/chat/room/${id}`, subCallback)
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
    setContent((c) => [...c, msg])
  }

  // 초기 메세지 불러오기
  const initContents = () => {
    axios.get(`http://localhost:8080/api/chat/rooms/${id}?memberId=${user.userId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }).then((e) => {
      setContent(e.data.messages)
    }).catch((e) => {
      console.log('error', e)
    })
  }

  useEffect(() => {
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
    })
  }

  return (
    <div>
      <h3>
        채팅
      </h3>
      <div>
        {content && content.map(d => {
          // 표현하려고 하는 값
          if (d.sender === user.nickName) {
            return (
              <div key={d.createdAt} style={{ marginLeft: '10rem' }}>
                <div>{d.sender} {d.readCount}</div>
                <div>{d.message} {d.createdAt}</div>
              </div>
            )
          } else {
            return (
              <div key={d.createdAt}>
                <div>{d.sender} {d.readCount}</div>
                <div>{d.message} {d.createdAt}</div>
              </div>
            )
          }

        })}
      </div>
      <div style={{marginTop: '10rem'}}>
        <input
          style={{width: '30vw'}}
          value={ms}
          onChange={_onChange}
          name={"ms"}
        />
        <button
          type={"button"}
          onClick={() => {
            handler(ms);
            setMs("");
          }}
        >
          전송
        </button>
      </div>
    </div>
  )
};

export default Chat;