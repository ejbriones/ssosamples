import React, {useEffect,useState} from 'react'
import qs from 'query-string';
import { useDispatch, useSelector } from 'react-redux';
import { getAuthenticationAccessToken} from 'app/store/userSlice';

export default function Callback() {

  const authResponse = qs.parse(window.location.search);
  const dispatch = useDispatch();

  useEffect(() =>{
      dispatch(getAuthenticationAccessToken(authResponse.code));
  },[dispatch,authResponse])

  return (
    <div>Splash</div>
  )
}
