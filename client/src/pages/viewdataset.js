import Head from 'next/head'
import App from 'next/app'
import React, {useEffect, useRef, useState} from 'react'
import { useSearchParams } from 'next/navigation'
import { useUser, withPageAuthRequired } from "@auth0/nextjs-auth0/client";

import Button from '@/_components/button';
import DatasetLabeller from '@/_components/datasetLabeller';
import StatusBox from '@/_components/statusBox';
import LabelsetSelector from '@/_components/labelsetSelector';
import EditableText from '@/_components/editableText';

const ViewDataset = ({user, error, isLoading}) => {

    const title = "UAL TaNC App - View Dataset"

    var params = useSearchParams()
    let param_labelset_id = params.get('labelset_id')
    let param_dataset_id = params.get('dataset_id')

    const [dataset, setDataset] = useState({
      id:"",
      name:"",
      artworks:[]
    })
    const [labelset, setLabelset] = useState({"_id":"", labels:[]})

    const [enableLabelling, setEnableLabelling] = useState(false)
    const [setupLabels, setSetupLabels] = useState(false)
    const [datasetStatus, setDatasetStatus] = useState("")
    const [dataset_id, setDatasetId] = useState("")
    const [labellingSchema, setLabellingSchema] = useState("0")
    const [labelset_id, setLabelsetId] = useState("")
    const [labelling_guide, setLabellingGuide] = useState("")

    const getLabelset = (labelset_id) => {
  
      const requestOptions = {
        method: 'GET',
        mode: 'cors',
        headers: {'Content-Type': 'application/json'}
      };
  
      fetch((process.env.NEXT_PUBLIC_SERVER_URL || "") + "/backend/labelset?" + new URLSearchParams({
        labelset_id:labelset_id,
        include_labels:true
      }), requestOptions)
      .then(res => res.json()).then((res) => {
        setLabelset(res.data)
      })
    }

    const updateLabelset = (labelset_id, data) => {

      console.log(data)
      console.log(labelset_id)
  
      const requestOptions = {
        method: 'GET',
        mode: 'cors',
        headers: {'Content-Type': 'application/json'}
      };
  
      try{
        fetch((process.env.NEXT_PUBLIC_SERVER_URL || "") + "/backend/labelset_update?" + new URLSearchParams({
          labelset_id:labelset_id,
          data:JSON.stringify(data)
        }), requestOptions)
        .then(res => res.json()).then((res) => {
          if (res.status==200){
            getLabelset(labelset_id)
          }
        })
      } catch (e){
        console.log("ERROR")
        console.log(e)
      }

    }

    const getDataset = (dataset_id) => {

      const requestOptions = {
        method: 'GET',
        mode: 'cors',
        headers: {'Content-Type': 'application/json'}
      };
    
      try {
        fetch((process.env.NEXT_PUBLIC_SERVER_URL || "") + "/backend/dataset?" + new URLSearchParams({
          dataset_id:dataset_id,
          include_items:true
        }),requestOptions)
        .then(response => response.json())
        .then(
          res => {
            console.log("in /dataset response")
            console.log(res.data)
            setDatasetStatus("Loaded "+res.data.artwork_count+" data records")
            setDataset(res.data)
          }
        )
      } catch (e){
        console.log("ERROR")
        console.log(e)
      }
    }

    const updateDataset = (dataset_id, data) => {

      console.log(data)
      console.log(dataset_id)
  
      const requestOptions = {
        method: 'GET',
        mode: 'cors',
        headers: {'Content-Type': 'application/json'}
      };
  
      try{
        fetch((process.env.NEXT_PUBLIC_SERVER_URL || "") + "/backend/dataset_update?" + new URLSearchParams({
          dataset_id:dataset_id,
          data:JSON.stringify(data)
        }), requestOptions)
        .then(res => res.json()).then((res) => {
          console.log(res)
          if (res.status==200){
            getDataset(dataset_id)
          }
        })
      } catch (e){
        console.log("ERROR")
        console.log(e)
      }

    }

    const onLabelsChanged = (e) =>{
      getLabelset(labelset_id)
    }

    const onButtonOneClick = (e) => {
      if (setupLabels){
        setLabelset({"_id":"", labels:[]})
      }
      setSetupLabels(!setupLabels)
    }

    const handleLabellingGuideUpdate = (e) => {
      e.preventDefault()
      updateLabelset(labelset_id,{"labelling_guide":labelling_guide})
    }

    useEffect(() => {
      if (dataset_id!= ""){
        setDatasetStatus("Loading dataset...")
        getDataset(dataset_id)
      }
    }, [dataset_id])

    useEffect(() => {
      if (labelset_id!= "" && labelset_id != "0" && labelset_id != "-1"){
        getLabelset(labelset_id)
      }
    }, [labelset_id])

    useEffect(() => {
      if (labelset._id!=""){
        if ('labelling_guide' in labelset) setLabellingGuide(labelset.labelling_guide)
        if ((labelset['owner'] == user.sub)){
          setEnableLabelling(true)
        }
        setSetupLabels(true)
      }
    },[labelset])

    useEffect(()=>{
      if(param_dataset_id!=undefined && dataset_id==""){
        setDatasetId(param_dataset_id)
      }
      if(param_labelset_id!=undefined && labelset_id==""){
        setLabelsetId(param_labelset_id)
      }
    },[])


    return (

      <>
      <Head>
        <title>{title}</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.1/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-+0n0xVW2eSR5OomGNYDnhzAbDsOXxcvSN1TPprVMTNDbiYZCxYbOOl7+AMvyTG2x" crossOrigin="anonymous"/>
        <link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/1.10.25/css/dataTables.bootstrap5.css"/>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.3.0/font/bootstrap-icons.css"/>
      </Head>
      <main>
          <h1>Dataset</h1>
          <hr/>
          <h3>
          {(dataset.owner == user.sub) ? (
            <EditableText onEditSubmit={(title)=>{updateDataset(dataset["_id"],{"name":title})}}>
              {dataset.name}
            </EditableText>
          ) : (
            dataset.name
          )}
          </h3>
          <hr/>
          {((labelset['owner'] == user.sub) || (labelset["_id"]=="")) ? (
            <>
              <Button content={setupLabels ? "Disable labelling mode" : "Enable labelling mode"} onClick={onButtonOneClick}></Button>
              <hr/>
            </>
          ) : (<></>)}
          {(setupLabels && labelset["_id"]!="") ? (
            <>
              <h3>
                <span>Labelset: </span>
                {(labelset['owner'] == user.sub) ? (
                  <EditableText
                    onEditSubmit={(title)=>{updateLabelset(labelset["_id"],{"name":title})}}
                  >{labelset['name']}</EditableText>
                ) : (
                  labelset['name']
                )}
              </h3>
                {enableLabelling ? (
                  <>
                    <form>
                      <label>Labelling guide:</label><br/>
                      <textarea type="text" className="wide_input" name="labelling_guide" value={labelling_guide} 
                      required onChange={e => setLabellingGuide(e.target.value)}/><br/>
                      <button type="submit" onClick={handleLabellingGuideUpdate}>Save updated guide</button>
                    </form><br/>
                  </>
                ) : (
                  (labelling_guide!="") ? (
                    <p><span className="label-header">Labelling Guide:</span> <i>{labelling_guide}</i></p>
                  ) : (
                    <p><span className="label-header">Labelling Guide:</span> <i>None</i></p>
                  )
                )}
              <span><b>Label Count: {labelset.labels.length}</b></span>
              <hr/>
            </>
          ) : <></>}
          {setupLabels ? (
            <>
              {(labelset["_id"]=="") ? (
              <>
                <LabelsetSelector 
                  selector_type={'viewdataset'}
                  user_id={user.sub}
                  dataset_id={dataset_id}
                  enableLabelsetCreate={true}
                  onLabelsetSelect={(labelset_id) => {setLabelsetId(labelset_id)}}
                  onLabelsetCreate={(labelset_id) => {setLabelsetId(labelset_id)}}
                />
                <hr/>
              </>  
              ) : <></>}
            </>
          ) : <></>
          }
          {dataset.artworks.length > 0 ? (
            <DatasetLabeller
              dataset={dataset} 
              labelset={labelset}
              showLabels={setupLabels && labelset["_id"]!=""}
              enableLabelling={enableLabelling}
              onLabelsChanged={onLabelsChanged}
            />) : null}

          <StatusBox text={datasetStatus}></StatusBox>

          <script type="text/javascript" charSet="utf8" src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
          <script type="text/javascript" charSet="utf8" src="https://cdn.datatables.net/1.10.25/js/jquery.dataTables.js"></script>
          <script type="text/javascript" charSet="utf8" src="https://cdn.datatables.net/1.10.25/js/dataTables.bootstrap5.js"></script>

      </main>

      </>
  )
}

export default withPageAuthRequired(ViewDataset)