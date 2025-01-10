import Head from 'next/head'
import React, {useEffect, useState} from 'react'

import AnalyserList from '../_components/analyserList'
import DatasetList from '../_components/datasetList'
import StatusBox from '@/_components/statusBox';
import { useUser, withPageAuthRequired } from "@auth0/nextjs-auth0/client";
import Link from 'next/link';


const Home = ({user, error, isLoading}) => {

    const title = "UAL TaNC App"

    const [datasets, setDatasets] = useState([{id:"Loading...",name:" ",status:""}])
    const [analysers, setAnalysers] = useState([{id:"Loading...",name:" ",dataset_id:"",category_id:"",dataset_name:"",category_name:""}])
    const [status, setStatus] = useState("Unknown")

    useEffect(() => {
      getAnalysers()
      getDatasets()
    },[])

    const getAnalysers = () => {
      const requestOptions = {
        method: 'GET',
        mode: 'cors',
        headers: {'Content-Type': 'application/json'}
      };
  
      fetch((process.env.NEXT_PUBLIC_SERVER_URL || "") + "/backend/analysers?" + new URLSearchParams({
        user_id:user.sub,
        include_names:true // Returns names of dataset and categories not just IDs
      }), requestOptions)
      .then(
        response =>  response.json()
      ).then(
        res => {
          console.log(res)
          if (res.status == 200)
            setAnalysers(res.data)
        }
      )
    }

    const getDatasets = () => {
      const requestOptions = {
        method: 'GET',
        mode: 'cors',  
        headers: {'Content-Type': 'application/json'}
      };
  
      fetch((process.env.NEXT_PUBLIC_SERVER_URL || "") + "/backend/datasets?" + new URLSearchParams({
        user_id:user.sub
      }), requestOptions)
      .then(
        response => response.json()
      ).then(
        res => {
          console.log(res)
          if (res.status == 200)
            setDatasets(res.data)
        }
      )
    }
    
    const classifierDeleteHandler = (analyser_id) => {
      setStatus("Deleting analyser...")
      const requestOptions = {
        method: 'POST',
        mode: 'cors',
        headers: {'Content-Type': 'application/json'},
      };
      
      fetch((process.env.NEXT_PUBLIC_SERVER_URL || "") + "/backend/classifier_delete?" + new URLSearchParams({
        analyser_id:analyser_id
      }), requestOptions)
      .then(
        response => response.json()
      ).then(
        data => {
          setStatus("Analyser deleted")
          console.log(data)
          getAnalysers()
        }
      )
    }

    const datasetDeleteHandler = (dataset_id) => {
      setStatus("Deleting dataset (this can take a few minutes)...")
      const requestOptions = {
        method: 'POST',
        mode: 'cors',
        headers: {'Content-Type': 'application/json'}
      };
      
      fetch((process.env.NEXT_PUBLIC_SERVER_URL || "") + "/backend/dataset_delete?" + new URLSearchParams({
        dataset_id:dataset_id
      }), requestOptions)
      .then(
        response => response.json()
      ).then(
        data => {
          setStatus("Dataset deleted")
          console.log(data)
          getDatasets()
        }
      )
    }
    
    return (

      <>
      <Head>
        <title>{title}</title>
      </Head>
        <main>
            <div className="container">
              <h1><i>Welcome {user.name === user.email ? user.nickname : user.name}!</i></h1>
              <hr/>
              {analysers.length>0 ? (
                <>
                  <h2>Analysers</h2>
                  <AnalyserList user_id={user.sub} analysers={analysers} onDeleteHandler={classifierDeleteHandler}/>
                </>
              ) : (
                <div className='feature-box intro'>
                  <h4>Getting started</h4>
                  <div>Welcome! This app is designed to enable anyone to create their own AI-driven tools to assist in research activities.</div>
                  <div>By creating analysers, you will be able to add new labels to items in a collection, at scale.</div><br/>
                  <div>All you will need is a few labelled examples and a description of what you would like to identify.</div>
                  <div>With this small set of carefully curated information, you can create an analyser for any purpose, for use on any digitised collection</div>
                  <br/>
                  <ul>
                    <li>To begin creating an analyser, go to the <Link href="/analyser">New Analyser</Link> page</li>
                    <li>To use your own data to help create an analyser, upload your data at the <Link href="/uploaddataset">New Dataset</Link> page</li>
                  </ul>
                </div>
              )}
              <br/>
              <h2>Datasets</h2>    
              <DatasetList user_id={user.sub} datasets={datasets} onDeleteHandler={datasetDeleteHandler}/>
              {status != "Unknown" ? (
                <StatusBox text={status}></StatusBox>
              ) : (<></>)}
            </div>
        </main>
      </>
  )
}

export default withPageAuthRequired(Home)