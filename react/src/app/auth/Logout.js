import { useEffect } from 'react';
import JwtService from './services/jwtService';

export default function Logout() {
    useEffect(() => {
        alert('test')
        setTimeout(() => {
          JwtService.logout();
        }, 1000);
      }, []);
  return (
    <div>Logout</div>
  )
}
