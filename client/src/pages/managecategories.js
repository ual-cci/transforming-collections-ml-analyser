
import Head from 'next/head'
import React, {useEffect, useState} from 'react'
import Link from 'next/link'
import { useUser, withPageAuthRequired } from "@auth0/nextjs-auth0/client";
import { useRouter } from 'next/navigation'
import CategoriesList from '@/_components/categoriesList';

const ManageCategories = ({user, error, isLoading}) =>{

    useEffect(() => {
      getCategories()
    },[])

    const [categories, setCategories] = useState([{id:"Loading...",name:" "}])

    if (isLoading) return <div>Loading...</div>;
    if (error) return (
      <>
        <div>User not logged in, access to this page is forbidden</div>
        <Link href="/api/auth/login">
          <button>Login</button>
        </Link>
      </>
    );

    const getCategories = () =>{
      console.log("getting categories")
      const requestOptions = {
        method: 'GET',
        mode: 'cors', 
        headers: {'Content-Type': 'application/json'}
      };
  
      fetch((process.env.NEXT_PUBLIC_SERVER_URL || "") + "/backend/categories?" + new URLSearchParams({
        user_id:user.sub
      }), requestOptions)
      .then(
        response => response.json()
      ).then(
        res => {
          console.log(res)
          if (res.status == 200)
            setCategories(res.data)
        }
      )
    }

    const categoryDeleteHandler = (category_id) => {

      const requestOptions = {
        method: 'POST',
        mode: 'cors',
        headers: {'Content-Type': 'application/json'}
      };
      
      fetch((process.env.NEXT_PUBLIC_SERVER_URL || "") + "/backend/category_delete?" + new URLSearchParams({
        category_id:category_id
      }), requestOptions)
      .then(
        response => response.json()
      ).then(
        data => {
          console.log(data)
          getCategories()
        }
      )
    }

  const title = "UAL TaNC App - Create Category"

  const [new_category_name, setNewCategoryName] = useState("")

  const handleSubmit = (e) => {
    e.preventDefault();

    const requestOptions = {
      method: 'POST',
      mode: 'cors'
    };

    fetch((process.env.NEXT_PUBLIC_SERVER_URL || "") + "/backend/category_add?" + new URLSearchParams({
      name:new_category_name,
      user_id:user.sub
    }), requestOptions)
    .then(res => res.json()).then((data) => {
      getCategories()
    })
  }
    
  return (
      <>
      <Head>
        <title>{title}</title>
      </Head>
      <main>
        <div className="container">
        <h1>Categories</h1>  
        <h4>Create New Category</h4>
        <form onSubmit={handleSubmit}>
          <label>Name:</label>
          <input type="text" name="name" value={new_category_name} required onChange={e => setNewCategoryName(e.target.value)}/>
          <input type="submit" value="Add New Category"/>
        </form>   
        <br/>    
        <CategoriesList user={user} categories={categories} onDeleteHandler={categoryDeleteHandler}/>
        </div>
      </main>
      </>
  )
}

export default withPageAuthRequired(ManageCategories);