import Head from 'next/head'
import React, {useEffect, useState} from 'react'
import { useRouter } from 'next/navigation'
import { useUser, withPageAuthRequired } from "@auth0/nextjs-auth0/client";
import StatusBox from '@/_components/statusBox';
import { useSearchParams } from 'next/navigation'

import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css'
import CreateAnalyser from '@/_components/createanalyser';
import UseAnalyser from '@/_components/useAnalyser';
import EditAnalyser from '@/_components/editAnalyser';
import ErrorBox from '@/_components/errorBox';
import ReviewAnalyser from '@/_components/reviewAnalyser';
import AnalyserVersionSelector from '@/_components/analyserVersionSelector';
import EditableText from '@/_components/editableText';
import Footer from '@/_components/buttonFooter';
import { getFilterErrorString } from '@/_helpers/utills';

const Analyser = ({user, error, isLoading}) =>{

  const title = "UAL TaNC App - Analyser Creator"

  const [model_source, setModelSource] = useState("")
  const [analyser_id, setAnalyserId] = useState("")
  const [analyser, setAnalyser] = useState({})
  const [analyser_name, setAnalyserName] = useState("")

  const [test_sample_ids, setTestSampleIds] = useState([])
  const [test_sample_predictions, setTestSamplePredictions] = useState([])
  const [unlabelledTestData, setUnlabelledTestData] = useState("")

  const [sample_ids, setSampleIds] = useState([])
  const [results, setResults] = useState({
    text:{}
  })

  const [analyserStatus, setAnalyserStatus] = useState("Unknown")
  const [errorStatus, setErrorStatus] = useState({
    text:"",
    type:""
  })

  const [tabIndex, setTabIndex] = useState(0);
  const [tabsDisabled, setTabsDisabled] = useState({
    0:false,
    1:true,
    2:true,
    3:true,
    4:true,
  })

  const router = useRouter()
  var params = useSearchParams()

  const getModelSource = () => {
    const requestOptions = {
      method: 'GET',
      mode: 'cors',
      headers: {'Content-Type': 'application/json'}
    };

    fetch((process.env.NEXT_PUBLIC_SERVER_URL || "") + "/backend/model_source?" + new URLSearchParams({
    }), requestOptions)
    .then(
      response =>  response.json()
    ).then(
      res => {
        console.log(res)
        if (res.status == 200)
          setModelSource(res.data)
      }
    )
  }

  const getAnalyser = (id) => {

    const requestOptions = {
      method: 'GET',
      mode: 'cors',
      headers: {'Content-Type': 'application/json'}
    };

    fetch((process.env.NEXT_PUBLIC_SERVER_URL || "") + "/backend/analyser?" + new URLSearchParams({
      analyser_id:id,
      include_names:true,
      include_versions:true
    }), requestOptions)
    .then(res => res.json()).then((res) => {
      if (res.status == "200"){
        let analyser=res.data
        setAnalyser(analyser)
        setTabsDisabled({
          0:false,
          1:!((analyser['dataset_id'].length>0 && analyser['labelset_id'].length>0) && (analyser.owner == user.sub)),
          2:!(("predictions" in analyser && analyser['predictions'].length>0) && ("accuracy" in analyser && analyser['accuracy'].toString().length>0)),
          3:!(("accuracy" in analyser) && (analyser['accuracy'].toString().length>0)), //TODO Store target accuracy & only enable Use tab if accuracy is high enough
          4:true
        })
        if ("predictions" in analyser){
          setTestSamplePredictions(analyser['predictions'])
        }
        if ("sample_ids" in analyser) {
          setTestSampleIds(analyser['sample_ids'])
        }
      } else {
        setErrorStatus({
          text:res.error,
          type:"error"
        })
      }
    })
  }

  const getPredictions = (analyserid, dataset_config, sampleids, example_ids) => {

    console.log("get predictions")

    let pred_type = "dataset_id" in dataset_config && dataset_config['dataset_id']!= null ? "use" : "test"

    console.log(pred_type)

    const requestOptions = {
      method: 'GET',
      mode: 'cors',
      headers: {'Content-Type': 'application/json'},
    };

    fetch((process.env.NEXT_PUBLIC_SERVER_URL || "") + "/backend/llm_predictions?"+ new URLSearchParams({
      analyser_id:analyserid,
      dataset_id:"dataset_id" in dataset_config ? dataset_config['dataset_id'] : null,
      num_predictions:"num_predictions" in dataset_config ? dataset_config['num_predictions'] : 0,
      start:"preds_start_index" in dataset_config ? dataset_config["preds_start_index"] : 0,
      end:"preds_end_index" in dataset_config ? dataset_config["preds_end_index"] : 0,
      auto_select_sample:"auto_select_sample" in dataset_config ? dataset_config["auto_select_sample"] : null,
      sample_ids: sampleids
    }), requestOptions)
    .then(response => response.json())
    .then(res => {
      if (res.status == "200" && res.data.predictions!=null){
        //check if every item triggered the content filter
        let preds = res.data.predictions.map(a => Object.values(a)).flat()
        let all_triggered = preds.every((val, i, arr) => val === 'content_filter')
        if (all_triggered===false) {
          let result_string = "Predicted results for " + res.data.predictions.length + " items."
          if (res.data.status=="filtered_success"){
            setErrorStatus({
              text:getFilterErrorString(res.data.errors, false),
              type:"warning"
            })
          }
          setAnalyserStatus(result_string)
          if (pred_type == "use"){
            setResults(res.data.predictions)
            if (dataset_config["auto_select_sample"] == 'true'){
              setSampleIds(res.data.sample_ids)
            }
          } else {
            setTestSamplePredictions(res.data.predictions)
            setTestSampleIds(res.data.sample_ids)
            setUnlabelledTestData(res.data.unlabelledTestData)
          }
        } else {
          setAnalyserStatus("Error: Analyser predictions failed (see details below)")
          setErrorStatus({
            text:getFilterErrorString(res.data.errors, true),
            type:"error"
          })
        }
      } else {
        setAnalyserStatus("Error: Analyser predictions failed (see details below)")
        setErrorStatus({
          text:res.error,
          type:"error"
        })
      }
    }).then(() => {
      getAnalyser(analyser_id)
    })
  }

  const createAnalyser = (config, data) => {
    setAnalyserStatus("Creating analyser...")
    const requestOptions = {
      method: 'GET',
      mode: 'cors',
      headers: {'Content-Type': 'application/json'},
    };

    console.log(config)

    fetch((process.env.NEXT_PUBLIC_SERVER_URL || "") + "/backend/analyser_new?"+ new URLSearchParams({
      user_id:user.sub,
      name:data.analyser_name,
      task_description:data.task_description,
      analyser_type:data.chosen_analyser_type,
      labelling_guide:data.labelling_guide,
      dataset_id:data.chosen_dataset_id,
      category_id:data.chosen_category_id,
      labelset_id:data.chosen_labelset_id,
      example_ids:JSON.stringify(data.example_ids),
      auto_select_examples:'auto_select_examples' in config ? config['auto_select_examples'] : false,
      num_examples:'num_examples' in config ? config['num_examples'] : 0,
      example_start_index:'examples_start_index' in config ? config['examples_start_index'] : 0,
      example_end_index:'examples_end_index' in config ? config['examples_end_index'] : 0
    }), requestOptions)
    .then(response => response.json())
    .then(res => {
      setAnalyserStatus("")
      console.log(res)
      setAnalyserId(res.data.analyser_id)
      router.push("/analyser?" + new URLSearchParams({
        analyser_id:res.data.analyser_id
      }))
      return res.data.analyser_id
    })
  }

  const updateAnalyser = (update_data) =>{
    console.log("update analyser")
    const requestOptions = {
      method: 'GET',
      mode: 'cors',
      headers: {'Content-Type': 'application/json'},
    };

    fetch((process.env.NEXT_PUBLIC_SERVER_URL || "") + "/backend/analyser_update?"+ new URLSearchParams({
      analyser_id:analyser_id,
      update_data:JSON.stringify(update_data),
      new_version:false
    }), requestOptions)
    .then(response => response.json())
    .then(res => {
      console.log(res)
      if(res.status=="500"){
        console.log(res['error'])
      } else {
        getAnalyser(analyser_id)
      }
    })
  }

  const handleSave = (config, data) => {
    createAnalyser(config, data)
  }

  const handleSetupUpdate = () => {
    getAnalyser(analyser_id)
  }

  const handleVersionChange = () => {
    setAnalyserStatus("Loading version...")
    getAnalyser(analyser_id)
    setAnalyserStatus("Version Loaded")
  }

  const handleGetPredictions = (analyser_id, config, latest_sample_ids, example_ids) => {
    setAnalyserStatus("Analyser updated, getting test results...")
    getPredictions(analyser_id, config, latest_sample_ids, example_ids)
  }

  const handleAnalyserUpdate = (analyser_id, config, latest_sample_ids, error="") => {
    if (error.length == 0){
      getAnalyser(analyser_id)
      if (config !== "" && latest_sample_ids !== "") {
        handleGetPredictions(analyser_id, config, latest_sample_ids)
      }
    } else {
      setAnalyserStatus("Error: Analyser save failed")
    }

  }

  const handleLocalTestSampleUpdate = (new_sample_ids) =>{
    setTestSampleIds(new_sample_ids)
  }

  const handleLocalSampleUpdate = (new_sample_ids) =>{
    setSampleIds(new_sample_ids)
  }

  const handleUseDatasetChange = () => {
    setSampleIds([])
    setResults([])
  }

  const handleUseAnalyser = (analyser_id, dataset_config, latest_sample_ids) => {
    setErrorStatus({
      text:"",
      type:""
    })
    setAnalyserStatus("Calculating new results...")
    getPredictions(analyser_id, dataset_config, latest_sample_ids)
  }

  const handleError = (error_text) => {
    if (error_text.length>0){
      console.log("ERROR")
      console.log(error_text)
      setAnalyserStatus("Error: Action Failed (see details below)")
    }
    setErrorStatus({
      text:error_text,
      type:"error"
    })
  }

  const handleWarning = (warning_text) => {
    setAnalyserStatus("")
    if (warning_text.length>0){
      console.log("WARNING")
      console.log(warning_text)
    }
    setErrorStatus({
      text:warning_text,
      type:"warning"
    })
  }

  const handleDownload = () => {
    setAnalyserStatus("Results downloading (Check your browser for the status)")
  }
  
  const handleTabChange = (tab_index) => {
    if ((('text' in errorStatus) && (errorStatus.text.length > 0)) || ((typeof(errorStatus) == "string") && (errorStatus.length != 0))){
      setErrorStatus({
        text:"",
        type:""
      })
    }
    if (analyserStatus.length != 0){
      setAnalyserStatus("")
    }
    setTabIndex(tab_index)
  }

  useEffect(() => {
    getModelSource()
  }, [model_source])

  useEffect(() => {
    if (analyser_id!= ""){
      getAnalyser(analyser_id)
    }
  }, [analyser_id])

  useEffect(() => {
    let id = params.get('analyser_id')
    if (id!= "" && id!=null){
      setAnalyserId(id)
      getAnalyser(id)
    } else {
      setAnalyserId("")
      setTabsDisabled({
        0:false,
        1:true,
        2:true,
        3:true,
        4:true,
      })
      setAnalyser({})
      setTabIndex(0)
    }
  }, [params])
    
  return (
      <>
      <Head>
        <title>{title}</title>
      </Head>
      <main>
        <div className="container">
        <h1>Analyser</h1>
        <hr/>
          {(Object.keys(analyser).length!=0 && analyser.name != "") ? ( 
            <h3><i>
              <EditableText
                onEditSubmit={(name)=>{updateAnalyser({"name":name})}}
              >
                {analyser.name}
              </EditableText>
            </i></h3>
          ):(
            <> 
              {analyser_name!="" ? (
                <h3><i>{analyser_name}</i></h3>
              ) : (
                <h3><i>*Untitled*</i></h3>
              )}
            </>
          )}
          {((Object.keys(analyser).length!=0) && (analyser.owner == user.sub)) ? (
            <AnalyserVersionSelector analyser={analyser} onVersionChange={handleVersionChange}></AnalyserVersionSelector>
          ) : (<></>) }
          <br/>

          <Tabs selectedIndex={tabIndex} onSelect={handleTabChange}>
              <TabList>
                <Tab disabled={tabsDisabled[0]}>{Object.keys(analyser).length>0 ? "Overview" : "Setup"}</Tab>
                <Tab disabled={tabsDisabled[1]}>Test & Improve</Tab>
                <Tab disabled={tabsDisabled[2]}>Review</Tab>
                <Tab disabled={tabsDisabled[3]}>Use</Tab>
              </TabList>

              <TabPanel>
                <CreateAnalyser 
                  user={user} 
                  analyser_id={analyser_id}
                  analyser={analyser}
                  showPredictions={false}
                  accordionLabels={[
                    Object.keys(analyser).length==0 ? "Step 1: Add Details" : "Details",
                    Object.keys(analyser).length==0 ? "Step 2: Add Knowledge Source" : "Knowledge Source"
                  ]}
                  getAnalyser={getAnalyser}
                  onUpdate={handleSetupUpdate}
                  onComplete={handleSave}
                  onError={handleError}
                  onWarning={handleWarning}
                ></CreateAnalyser>
              </TabPanel>
              <TabPanel>
                <EditAnalyser
                  user={user} 
                  analyser_id={analyser_id}
                  analyser={analyser}
                  editable={true}
                  predictions={test_sample_predictions} 
                  sample_ids={test_sample_ids}
                  sectionLabels={["Edit analyser, label data and choose training examples","Choose test sample","Check results"]}
                  getAnalyser={getAnalyser}
                  onUpdate={handleAnalyserUpdate}
                  onComplete={handleGetPredictions}
                  onError={handleError}
                  onWarning={handleWarning}
                  onSampleChange={handleLocalTestSampleUpdate}
                  onExampleChange={()=>{setAnalyserStatus("")}}
                  onTabChange={()=>{setAnalyserStatus("")}}
                  setAnalyserStatus={setAnalyserStatus}
                  model_source={model_source}
                ></EditAnalyser>
              </TabPanel>
              <TabPanel>
                <ReviewAnalyser
                  user_id={user.sub}
                  analyser_id={analyser_id}
                  analyser_version={analyser['version']}
                  analyser_versions={analyser.versions}
                  stored_accuracy={'accuracy' in analyser ? analyser['accuracy'] : ""}
                  analyser_type={analyser['analyser_type']}
                  analyser_owner={analyser['owner']}
                  onVersionChange={()=> {getAnalyser(analyser_id)}}
                  onTargetAccuracyReached={()=>{}} //TODO update availability of Use tab when target accuracy is reacheds
                  example_ids={analyser['example_refs']}
                  sample_ids={test_sample_ids}
                  unlabelledTestData={unlabelledTestData}
                  setUnlabelledTestData={setUnlabelledTestData}
                  predictions={test_sample_predictions} 
                />
              </TabPanel>
              <TabPanel>
                <UseAnalyser
                  user_id={user.sub}
                  analyser_id={analyser_id}
                  analyser={analyser}
                  sample_ids={sample_ids}
                  results={results}
                  onGetPredictions={handleUseAnalyser}
                  onGetAccuracy={()=>{}}
                  onError={handleError}
                  onDatasetChange={handleUseDatasetChange}
                  onSampleChange={handleLocalSampleUpdate}
                  OnDownload={handleDownload}
                  showPredictions={true}
                  model_source={model_source}
                ></UseAnalyser>
              </TabPanel>
              <TabPanel>
              </TabPanel>
            </Tabs>
          {analyserStatus != "Unknown" ? (
            <StatusBox text={analyserStatus}></StatusBox>
          ) : (<></>)}
          <ErrorBox status={errorStatus}></ErrorBox>
      </div>
      </main>
      </>
  )
}


export default withPageAuthRequired(Analyser);