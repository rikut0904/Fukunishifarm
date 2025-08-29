# Fukunishifarmサイト
## ローカル to lolipop
以下の関数をターミナルで実行することにより、lolipopに静的サイトとしてアップロード可能
```
npm run build
rsync -avz --delete -e "ssh -p 2222" ./{共有ドメイン-独自ドメイン}@ssh.lolipop.jp:/home/users/0/{共有ドメイン-独自ドメイン}/web/
```
