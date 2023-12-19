import Head from "next/head";
import { useState } from "react";
import styles from "../styles/Home.module.css";
import axios from "axios";
import {logtoClient} from '../lib/logto'

export const getServerSideProps = logtoClient.withLogtoSsr(async function ({ req, res }) {
  const { user } = req;
  if (process.env.LOGTO_ENABLE === "true" && !user.isAuthenticated) {
    res.setHeader('location', '/api/logto/sign-in');
    res.statusCode = 302;
    res.end();
  }
  return {
    props: {
      user: JSON.parse(JSON.stringify(user)),
    }
  };
});

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [number, setNumber] = useState(1);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  function getImages() {
    const token = process.env.OPENAI_API_KEY;
    if (token != "" && prompt != "") {
      setError(false);
      setLoading(true);
      axios
        .post(`/api/images?t=${token}&p=${prompt}&n=${number}&q=${quality}&s=${size}&st=${style}`)
        .then((res) => {
          setResults(res.data.result);
          setLoading(false);
        })
        .catch((err) => {
          setLoading(false);
          setError(true);
        });
    } else {
      setError(true);
    }
  }

  const [type, setType] = useState("png");
  const [quality, setQuality] = useState("standard");
  const [size, setSize] = useState("1024x1024");
  const [style, setStyle] = useState("vivid");

  function download(url) {
    axios
      .post(`/api/download`, { url: url, type: type })
      .then((res) => {
        const link = document.createElement("a");
        link.href = res.data.result;
        link.download = `${prompt}.${type.toLowerCase()}`;
        link.click();
      })
      .catch((err) => {
        console.log(err);
      });
  }

  function downloadImage(imageUrl, imageName) {
    // 使用fetch API来获取图片
    fetch(imageUrl)
        .then(response => response.blob()) // 将图片转换为Blob对象
        .then(blob => {
          // 创建一个指向Blob对象的URL
          const blobUrl = URL.createObjectURL(blob);
          // 创建一个a元素
          const a = document.createElement('a');
          // 设置a元素的href属性为Blob对象的URL
          a.href = blobUrl;
          // 设置下载的文件名
          a.download = imageName || 'download';
          // 触发a元素的点击事件，开始下载
          document.body.appendChild(a); // 将a元素添加到DOM中
          a.click();
          // 清理
          document.body.removeChild(a);
          URL.revokeObjectURL(blobUrl); // 释放Blob对象的URL
        })
        .catch(() => alert('图片下载失败'));
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>DALL-E 3 Web UI</title>
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Create images with <span className={styles.titleColor}>DALL-E 3</span>
        </h1>
        <p className={styles.description}>
          <input
            id="prompt"
            type="text"
            value={prompt}
            size={200}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="请输入描述"
          />
          <input
            id="number"
            type="number"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="Number of images"
            max="1"
            disabled={true}
          />
          {"  "}
          <button onClick={getImages}>生成 {number} 张图</button>
        </p>
        <small>
          质量:{" "}
          <select
            style={{ marginRight: '20px' }}
            id="quality"
            value={quality}
            onChange={(e) => setQuality(e.target.value)}>
            <option value="standard">Standard</option>
            <option value="hd">HD</option>
          </select>

          尺寸:{" "}
          <select
            style={{ marginRight: '20px' }}
            id="size"
            value={size}
            onChange={(e) => setSize(e.target.value)}>
            <option value="1024x1024">1024x1024</option>
            <option value="1792x1024">1792x1024</option>
            <option value="1024x1792">1024x1792</option>
          </select>

          风格:{" "}
          <select
            style={{ marginRight: '20px' }}
            id="style"
            value={style}
            onChange={(e) => setStyle(e.target.value)}>
            <option value="vivid">生动</option>
            <option value="natural">自然</option>
          </select>

          Download as:{" "}
          <select
            style={{ marginRight: '20px' }}
            id="type"
            value={type}
            disabled={true}
            onChange={(e) => setType(e.target.value)}>
            <option value="png">Png</option>
            <option value="webp">Webp</option>
            <option value="jpg">Jpg</option>
            <option value="gif">Gif</option>
            <option value="avif">Avif</option>
          </select>
        </small>
        <br />
        {error ? (<div className={styles.error}>Something went wrong. Try again.</div>) : (<></>)}
        {loading && <p>Loading...</p>}
        <div className={styles.grid}>
          {results.map((result) => {
            return (
              <div className={styles.card}>
                <img
                  className={styles.imgPreview}
                  src={result.url}
                  onClick={() => downloadImage(result.url, prompt+"."+type.toLowerCase())}
                />
                <div>
                  {result.revisedPrompt}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
