'use client'

import React from "react";
import Item from './item';

const ItemList = ({
    analyser_id,
    dataset,
    predictions
}) => {

  return(
  
    <table id="mydata" className="table table-striped">
            <thead>
            <tr>
                <th>ID</th>
                <th>Text</th>
                <th>Mark as Present</th>
                <th>Mark as Absent</th>
                <th>Predicted</th>
            </tr>
            </thead>
            <tbody>

                {dataset.map((item,index) => {
                  var item_predictions = predictions[String(item.id)]
                  const key = "item-" + item.id
                  if (typeof(item_predictions) == "string"){
                    item_predictions = [item_predictions]
                  }
                    return (
                        <Item key={key} analyser_id={analyser_id} item={item} predictions={item_predictions} />
                    )
                })}
              </tbody>
            </table>
  )
}
  
export default ItemList