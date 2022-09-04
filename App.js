import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View, TouchableOpacity, } from 'react-native';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import RNFetchBlob from 'rn-fetch-blob';
import { decode } from 'base64-arraybuffer';

import * as AWS from 'aws-sdk';
var awsCred = new AWS.Credentials({
  accessKeyId: process.env.AWS_accessKeyId,
  secretAccessKey: process.env.AWS_secretAccessKey,
});
const s3 = new AWS.S3({
  region: process.env.AWS_region,
  signatureVersion: 'v4',
  credentials: awsCred,
});

const App = () => {

  const [location, setLoaction] = useState('');

  const HtmlToPDF = async () => {
    const HTMLDATA2 = `<!DOCTYPE html>
    <html lang="en">
    
    <head>
        <title>Document</title>
    </head>
    
    <body>
        <div>
            <p><span>Test file </span></p>
        </div>
    </body>
    
    </html>`;

    let options = {
      html: HTMLDATA2,
      fileName: 'Sample_HTML_file',
      directory: 'Documents',
    };

    let file = await RNHTMLtoPDF.convert(options);
    return file.filePath;
  };

  const _onsenddata = async () => {
    HtmlToPDF().then(async path => {
      RNFetchBlob.fs
        .readFile(path, 'base64')
        .then(async data => {
          const arrayBuffer = decode(data);
          var keyPrefix = `Dirctory_name/File_name.pdf`;
          try {
            const params = {
              Key: keyPrefix,
              Body: arrayBuffer,
              Bucket: process.env.AWS_Bucket_name,
              ACL: 'public-read',
            };
            s3.upload(params, function (err, data) {
              if (err) {
                console.log('upload Error', err);
              } else {
                console.log('upload Success', data);
                setLoaction(data.Location);
              }
            });
          } catch (error) {
            console.log('uploadData error:: ', error);
          }
        })
        .catch(err => { });
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.titleText}>
        Upload arrayBuffer to AWS S3 Bucket from React Native App
      </Text>
      <View style={styles.container}>
        <TouchableOpacity
          activeOpacity={0.5}
          style={styles.buttonStyle}
          onPress={_onsenddata}>
          <Text style={styles.textStyleWhite}>Upload</Text>
        </TouchableOpacity>
        {
          location &&
          <Text>URL Location: {location}</Text>
        }
      </View>
    </SafeAreaView>
  );
};

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#fff',
  },
  titleText: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingVertical: 20,
  },
  textStyleWhite: {
    padding: 10,
    color: 'white',
  },
  buttonStyle: {
    alignItems: 'center',
    backgroundColor: 'orange',
    marginVertical: 10,
    width: '100%',
  },
});
