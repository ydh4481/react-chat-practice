import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const Home = (props) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState("");
  const [id, setId] = useState("yaejingo@naver.com");
  const [pw, setPw] = useState("qwe123");
  const [rooms, setRooms] = useState([]);
  const [receiver, setReceiver] = useState("");

  // 로그인
  const login = () => {
    axios.post('http://localhost:8080/api/member/login', {
      email: id,
      password: pw
    }).then((e) => {
      setUser(e.data.data)
      setToken(e.data.data.accessToken)
      console.log(token)
      console.log(e.data)
    }).catch((e) => {
      window.alert('로그인 실패')
    })
  }

  // 처음 채팅방 불러오기
  const initRooms = () => {
    axios.get(`http://localhost:8080/api/chat/rooms?memberId=${user.userId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }).then((e) => {
      setRooms(e.data)
    })
  }
  const refreshRoom = () => {
    if (token) {
      initRooms()
    } else {
      window.alert('토큰 입력하세염')
    }
  }

  // 방 만들기
  const createRoom = () => {
    if (!token) {
      window.alert('토큰 입력하세염')
    } else {
      axios.post(`http://localhost:8080/api/chat/room?memberId=${user.userId}`,
        { receiver: receiver }, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }).then((e) => {
        initRooms()
      })
    }
  }
  return (
    <div>
      홈
      <div>
        <label htmlFor="">아이디</label>
        <input type="text" onChange={(e) => setId(e.target.value)} value={id}/>
        <label htmlFor="">비밀번호</label>
        <input type="text" onChange={(e) => setPw(e.target.value)} value={pw}/>

        <button onClick={login}>로그인</button>

      </div>
      <div>
        토큰: <span>{token}</span>
      </div>
      <div>
        <button onClick={refreshRoom}>채팅방 조회</button>
      </div>
      <div>
        <label htmlFor="">채팅방명</label>
        <input type="text" onChange={(e) => setReceiver(e.target.value)} value={receiver}/>
        <button onClick={createRoom}>채팅방 만들기</button>
      </div>
      <div>
        채팅방 리스트
        {rooms && rooms.map(room => (
          <div key={room.id}>
            <Link key={room.id} to={`/chat/${room.redisRoomId}`}
                  state={{ token: token, user: user }}>
              {room.redisRoomId} {room.roomName}
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
};

export default Home;