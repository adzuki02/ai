<h1><p align="center"><img src="./ai.svg" alt="藍" height="200"></p></h1>
<p align="center">An Ai for Misskey. <a href="./torisetu.md">About Ai</a></p>

## これなに
Misskey用の日本語Botです。

## インストール
> Node.js と npm と MeCab (オプション) がインストールされている必要があります。

まず適当なディレクトリに `git clone` します。
次にそのディレクトリに `config.json` を作成します。中身は次のようにします:
``` json
{
	"host": "https:// + あなたのインスタンスのURL (末尾の / は除く)",
	"i": "藍として動かしたいアカウントのアクセストークン",
	"master": "管理者のユーザー名(オプション)",
	"restrictCommunication": "制限モードを有効にする場合は true を入れる (無効にする場合は false)",
	"notingEnabled": "ランダムにノートを投稿する機能を無効にする場合は false を入れる",
	"keywordEnabled": "キーワードを覚える機能 (MeCab が必要) を有効にする場合は true を入れる (無効にする場合は false)",
	"serverMonitoring": "サーバー監視の機能を有効にする場合は true を入れる (無効にする場合は false)",
	"checkEmojisEnabled": "カスタム絵文字チェック機能を有効にする場合は true を入れる (無効にする場合は false)",
	"checkEmojisAtOnce": "カスタム絵文字チェック機能で投稿をまとめる場合は true を入れる (まとめない場合は false)",
	"mazeDisabled": "迷路の生成を無効にする場合は true を入れてください",
	"pollDisabled": "アンケートを無効にする場合は true を入れてください",
	"mecab": "MeCab のインストールパス (ソースからインストールした場合、大体は /usr/local/bin/mecab)",
	"mecabDic": "MeCab の辞書ファイルパス (オプション)",
	"memoryDir": "memory.jsonの保存先（オプション、デフォルトは'.'（レポジトリのルートです））"
}
```
`npm install` して `npm run build` して `npm start` すれば起動できます

## Dockerで動かす
まず適当なディレクトリに `git clone` します。
次にそのディレクトリに `config.json` を作成します。中身は次のようにします:
（MeCabの設定、memoryDirについては触らないでください）
``` json
{
	"host": "https:// + あなたのインスタンスのURL (末尾の / は除く)",
	"i": "藍として動かしたいアカウントのアクセストークン",
	"master": "管理者のユーザー名(オプション)",
	"restrictCommunication": "制限モードを有効にする場合は true を入れる (無効にする場合は false)",
	"notingEnabled": "ランダムにノートを投稿する機能を無効にする場合は false を入れる",
	"keywordEnabled": "キーワードを覚える機能 (MeCab が必要) を有効にする場合は true を入れる (無効にする場合は false)",
	"serverMonitoring": "サーバー監視の機能を有効にする場合は true を入れる (無効にする場合は false)",
	"checkEmojisEnabled": "カスタム絵文字チェック機能を有効にする場合は true を入れる (無効にする場合は false)",
	"checkEmojisAtOnce": "カスタム絵文字チェック機能で投稿をまとめる場合は true を入れる (まとめない場合は false)",
	"mazeDisabled": "迷路の生成を無効にする場合は true を入れてください",
	"pollDisabled": "アンケートを無効にする場合は true を入れてください",
	"mecab": "/usr/bin/mecab",
	"mecabDic": "/var/lib/mecab/dic/ipadic-utf8/",
	"memoryDir": "data"
}
```
`docker-compose build` して `docker-compose up` すれば起動できます。
`docker-compose.yml` の `enable_mecab` を `0` にすると、MeCabをインストールしないようにもできます。（メモリが少ない環境など）

## フォント
一部の機能にはフォントが必要です。藍にはフォントは同梱されていないので、ご自身でフォントをインストールディレクトリに`font.ttf`という名前で設置してください。

## 記憶
藍は記憶の保持にインメモリデータベースを使用しており、藍のインストールディレクトリに `memory.json` という名前で永続化されます。

## オリジナルの藍との相違点

### 制限モード
おひとりさまサーバーで、藍が多数のサーバーの多数のリモートユーザーをフォローする（させられる）ことを防ぎたい場合などに、制限モードを有効にできます。

制限モードを有効にすると、フォロワーが0人のリモートユーザーからのメンション・リプライ・引用リノートに一切反応しなくなります。

また、

- 詳細を取得したことのないリモートユーザー（藍が`users/show`APIエンドポイントに問い合わせを行ったことのないユーザー）
- 最後に詳細を取得したときに、フォロワーが0人だったリモートユーザー

に誕生日やバレンタインのメッセージを送信しなくなります。

制限モードが有効で、アカウントの設定がフォロー承認制になっている場合、フォロワーが0人のリモートユーザーからのフォローリクエストは自動で拒否し、それ以外のユーザーからのフォローリクエストは自動で承認します。

### キーワードを覚える機能
より多くのキーワードを覚えるために、仮名と英語の変換辞書を追加で利用することができます。

[Google日本語入力の和英辞書作成プロジェクト](https://github.com/KEINOS/google-ime-user-dictionary-ja-en) より [このディレクトリ](https://github.com/KEINOS/google-ime-user-dictionary-ja-en/tree/master/Google-ime-jp-%E3%82%AB%E3%82%BF%E3%82%AB%E3%83%8A%E8%8B%B1%E8%AA%9E%E8%BE%9E%E5%85%B8) のテキストファイルを連結し、`google-ime-user-dictionary-ja-en.txt`という名前で藍のインストールディレクトリに配置してください。  
（※`google-ime-jp-カタカナ英語辞書01-あ～お.txt`ファイルは連結から除外してください。）

## ライセンス
MIT

## Awards
<img src="./WorksOnMyMachine.png" alt="Works on my machine" height="120">
