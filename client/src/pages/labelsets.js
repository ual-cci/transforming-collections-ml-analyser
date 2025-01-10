
import Head from 'next/head'
import React, {useEffect, useState} from 'react'
import Link from 'next/link'
import { useUser, withPageAuthRequired } from "@auth0/nextjs-auth0/client";
import { useRouter } from 'next/navigation'
import LabelsetsList from '@/_components/labelsetsList';

const ManageLabelsets = ({user, error, isLoading}) =>{

    useEffect(() => {
      getLabelsets()
    },[])

    const [labelsets, setLabelsets] = useState([{id:"Loading...",name:" "}])

    if (isLoading) return <div>Loading...</div>;
    if (error) return (
      <>
        <div>User not logged in, access to this page is forbidden</div>
        <Link href="/api/auth/login">
          <button>Login</button>
        </Link>
      </>
    );

    const getLabelsets = () =>{
      console.log("getting labelsets")
      const requestOptions = {
        method: 'GET',
        mode: 'cors', 
        headers: {'Content-Type': 'application/json'}
      };
  
      fetch((process.env.NEXT_PUBLIC_SERVER_URL || "") + "/backend/labelsets?" + new URLSearchParams({
        user_id:user.sub,
        includeCount:true,
        includeNames:true
      }), requestOptions)
      .then(
        response => response.json()
      ).then(
        res => {
          console.log(res)
          if (res.status == 200)
            setLabelsets(res.data)
        }
      )
    }

    const labelsetDeleteHandler = (labelset_id) => {

      const requestOptions = {
        method: 'POST',
        mode: 'cors',
        headers: {'Content-Type': 'application/json'}
      };
      
      fetch((process.env.NEXT_PUBLIC_SERVER_URL || "") + "/backend/labelset_delete?" + new URLSearchParams({
        labelset_id:labelset_id
      }), requestOptions)
      .then(
        response => response.json()
      ).then(
        data => {
          console.log(data)
          getLabelsets()
        }
      )
    }

  const title = "UAL TaNC App - Labelsets"
    
  return (
      <>
      <Head>
        <title>{title}</title>
      </Head>
      <main>
        <div className="container">
        <h1>Labelsets</h1>  
        <hr/>
        <LabelsetsList user={user} labelsets={labelsets} onDeleteHandler={labelsetDeleteHandler}/>
        </div>
      </main>
      </>
  )
}

export default withPageAuthRequired(ManageLabelsets);