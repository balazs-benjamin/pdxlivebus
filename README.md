#PDXLiveBus
Portland Trimet live mapping of all buses, trains, and street cars

Now running on MeteorJS/MongoDB + LeafLet
This used to run with simple node/firebase but due to a lack of querying capabilities on firebase it was very difficult to manage the state of changing data.
Meteor has an amazing set of features and the concept behind it is something I support.

All meteor goodness can be found at
http://docs.meteor.com/


It is now even easier to run.
(I recommend getting Meteorite but not necessary, BUT YOU SHOULD)

```
meteor run
```

Want it on a server so you can show it off?

```
meteor deploy your-instance-of-pdxlivebus.meteor.com --password {PASSWORDSOYOUCANDOSTUFFSLATER}
```

What if you want your own domain name?

```
meteor deploy www.example.com
```
then just setup a CNAME for your domain to origin.meteor.com


Don't want it on meteors servers and want it on your own infrastructure?

```
meteor bundle pdxlivebus.tar.gz
```

then set some environment variables

```
PORT=3000 MONGO_URL=mongodb://localhost:27017/myapp node bundle/main.js
```