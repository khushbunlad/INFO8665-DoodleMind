### Build docker image
```docker build -t doodlemind-flask-app .```

### Run docker image 
```docker run -p 5004:5004 doodlemind-flask-app```

### Upload image to dockerhub
1. Login into docker
```docker login```
2. Add file to repository
```docker tag doodlemind-flask-app khushbunladwork/doodlemind-flask-app:latest```
3. Push file as latest version
```docker push khushbunladwork/doodlemind-flask-app:latest```

### Run frontend 

Prerequisite : Run Backend project

1. Open Project directory in terminal
2. Go to ```cd .\doodlemind-frontend\```
3. Run frontend project ```npm run dev``` 
