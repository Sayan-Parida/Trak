$DelaySeconds = 2
$Browser = "chrome.exe"

$Actions = @(
    [PSCustomObject]@{ Step = 1; Url = "https://www.google.com/search?q=Apache+Kafka+consumer+groups"; Type = "SEARCH"; Topic = "Kafka" }
    [PSCustomObject]@{ Step = 2; Url = "https://kafka.apache.org/documentation/"; Type = "OFFICIAL"; Topic = "Kafka" }
    [PSCustomObject]@{ Step = 3; Url = "https://github.com/apache/kafka"; Type = "GITHUB"; Topic = "Kafka" }
    [PSCustomObject]@{ Step = 4; Url = "https://stackoverflow.com/questions/tagged/apache-kafka"; Type = "STACK_OVERFLOW"; Topic = "Kafka" }
    [PSCustomObject]@{ Step = 5; Url = "https://www.confluent.io/blog/apache-kafka-consumer-group-partition-strategy/"; Type = "ARTICLE"; Topic = "Kafka" }
    [PSCustomObject]@{ Step = 6; Url = "https://www.google.com/search?q=Kafka+consumer+group+rebalance"; Type = "SEARCH"; Topic = "Kafka" }
    [PSCustomObject]@{ Step = 7; Url = "https://kafka.apache.org/36/documentation/#intro_consumers"; Type = "OFFICIAL"; Topic = "Kafka" }
    [PSCustomObject]@{ Step = 8; Url = "https://www.redpanda.com/guides/kafka-tutorial/kafka-consumer-groups"; Type = "ARTICLE"; Topic = "Kafka" }
    [PSCustomObject]@{ Step = 9; Url = "https://www.google.com/search?q=Kafka+consumer+group+partition+assignment"; Type = "SEARCH"; Topic = "Kafka" }
    [PSCustomObject]@{ Step = 10; Url = "https://stackoverflow.com/questions/tagged/apache-kafka?tab=frequent"; Type = "STACK_OVERFLOW"; Topic = "Kafka" }
    [PSCustomObject]@{ Step = 11; Url = "https://kafka.apache.org/documentation/#consumerconfigs"; Type = "OFFICIAL"; Topic = "Kafka" }

    [PSCustomObject]@{ Step = 12; Url = "https://www.google.com/search?q=Redis+data+structures+official+documentation"; Type = "SEARCH"; Topic = "Redis" }
    [PSCustomObject]@{ Step = 13; Url = "https://redis.io/docs/latest/develop/data-types/"; Type = "OFFICIAL"; Topic = "Redis" }
    [PSCustomObject]@{ Step = 14; Url = "https://github.com/redis/redis"; Type = "GITHUB"; Topic = "Redis" }
    [PSCustomObject]@{ Step = 15; Url = "https://stackoverflow.com/questions/tagged/redis"; Type = "STACK_OVERFLOW"; Topic = "Redis" }
    [PSCustomObject]@{ Step = 16; Url = "https://redis.io/blog/redis-on-flash/"; Type = "ARTICLE"; Topic = "Redis" }
    [PSCustomObject]@{ Step = 17; Url = "https://www.google.com/search?q=Redis+streams+consumer+groups"; Type = "SEARCH"; Topic = "Redis" }
    [PSCustomObject]@{ Step = 18; Url = "https://redis.io/docs/latest/develop/data-types/streams/"; Type = "OFFICIAL"; Topic = "Redis" }
    [PSCustomObject]@{ Step = 19; Url = "https://redis.io/docs/latest/develop/use/patterns/"; Type = "ARTICLE"; Topic = "Redis" }
    [PSCustomObject]@{ Step = 20; Url = "https://www.google.com/search?q=Redis+persistence+RDB+AOF"; Type = "SEARCH"; Topic = "Redis" }
    [PSCustomObject]@{ Step = 21; Url = "https://stackoverflow.com/questions/tagged/redis?tab=frequent"; Type = "STACK_OVERFLOW"; Topic = "Redis" }
    [PSCustomObject]@{ Step = 22; Url = "https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/"; Type = "OFFICIAL"; Topic = "Redis" }

    [PSCustomObject]@{ Step = 23; Url = "https://www.google.com/search?q=PostgreSQL+MVCC+official+documentation"; Type = "SEARCH"; Topic = "PostgreSQL" }
    [PSCustomObject]@{ Step = 24; Url = "https://www.postgresql.org/docs/current/mvcc.html"; Type = "OFFICIAL"; Topic = "PostgreSQL" }
    [PSCustomObject]@{ Step = 25; Url = "https://github.com/postgres/postgres"; Type = "GITHUB"; Topic = "PostgreSQL" }
    [PSCustomObject]@{ Step = 26; Url = "https://stackoverflow.com/questions/tagged/postgresql"; Type = "STACK_OVERFLOW"; Topic = "PostgreSQL" }
    [PSCustomObject]@{ Step = 27; Url = "https://www.cybertec-postgresql.com/en/postgresql-mvcc-and-snapshot-isolation/"; Type = "ARTICLE"; Topic = "PostgreSQL" }
    [PSCustomObject]@{ Step = 28; Url = "https://www.google.com/search?q=PostgreSQL+index+types+B-tree+GIN+GiST"; Type = "SEARCH"; Topic = "PostgreSQL" }
    [PSCustomObject]@{ Step = 29; Url = "https://www.postgresql.org/docs/current/indexes-types.html"; Type = "OFFICIAL"; Topic = "PostgreSQL" }
    [PSCustomObject]@{ Step = 30; Url = "https://www.postgresql.org/docs/current/explain.html"; Type = "ARTICLE"; Topic = "PostgreSQL" }
    [PSCustomObject]@{ Step = 31; Url = "https://www.google.com/search?q=PostgreSQL+query+planner+EXPLAIN+ANALYZE"; Type = "SEARCH"; Topic = "PostgreSQL" }
    [PSCustomObject]@{ Step = 32; Url = "https://stackoverflow.com/questions/tagged/postgresql?tab=frequent"; Type = "STACK_OVERFLOW"; Topic = "PostgreSQL" }
    [PSCustomObject]@{ Step = 33; Url = "https://www.postgresql.org/docs/current/performance-tips.html"; Type = "OFFICIAL"; Topic = "PostgreSQL" }

    [PSCustomObject]@{ Step = 34; Url = "https://www.google.com/search?q=Docker+containers+official+documentation"; Type = "SEARCH"; Topic = "Docker" }
    [PSCustomObject]@{ Step = 35; Url = "https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/"; Type = "OFFICIAL"; Topic = "Docker" }
    [PSCustomObject]@{ Step = 36; Url = "https://github.com/moby/moby"; Type = "GITHUB"; Topic = "Docker" }
    [PSCustomObject]@{ Step = 37; Url = "https://stackoverflow.com/questions/tagged/docker"; Type = "STACK_OVERFLOW"; Topic = "Docker" }
    [PSCustomObject]@{ Step = 38; Url = "https://docs.docker.com/build/building/best-practices/"; Type = "ARTICLE"; Topic = "Docker" }
    [PSCustomObject]@{ Step = 39; Url = "https://www.google.com/search?q=Docker+Compose+depends_on+healthcheck"; Type = "SEARCH"; Topic = "Docker" }
    [PSCustomObject]@{ Step = 40; Url = "https://docs.docker.com/compose/how-tos/startup-order/"; Type = "OFFICIAL"; Topic = "Docker" }
    [PSCustomObject]@{ Step = 41; Url = "https://docs.docker.com/engine/storage/volumes/"; Type = "ARTICLE"; Topic = "Docker" }
    [PSCustomObject]@{ Step = 42; Url = "https://www.google.com/search?q=Docker+networking+bridge+host+overlay"; Type = "SEARCH"; Topic = "Docker" }
    [PSCustomObject]@{ Step = 43; Url = "https://stackoverflow.com/questions/tagged/docker?tab=frequent"; Type = "STACK_OVERFLOW"; Topic = "Docker" }
    [PSCustomObject]@{ Step = 44; Url = "https://docs.docker.com/engine/network/"; Type = "OFFICIAL"; Topic = "Docker" }

    [PSCustomObject]@{ Step = 45; Url = "https://www.google.com/search?q=Kubernetes+pod+lifecycle+official+documentation"; Type = "SEARCH"; Topic = "Kubernetes" }
    [PSCustomObject]@{ Step = 46; Url = "https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/"; Type = "OFFICIAL"; Topic = "Kubernetes" }
    [PSCustomObject]@{ Step = 47; Url = "https://github.com/kubernetes/kubernetes"; Type = "GITHUB"; Topic = "Kubernetes" }
    [PSCustomObject]@{ Step = 48; Url = "https://stackoverflow.com/questions/tagged/kubernetes"; Type = "STACK_OVERFLOW"; Topic = "Kubernetes" }
    [PSCustomObject]@{ Step = 49; Url = "https://kubernetes.io/blog/2019/07/18/9-things-you-need-to-know-about-pods/"; Type = "ARTICLE"; Topic = "Kubernetes" }
    [PSCustomObject]@{ Step = 50; Url = "https://www.google.com/search?q=Kubernetes+service+discovery+DNS"; Type = "SEARCH"; Topic = "Kubernetes" }
    [PSCustomObject]@{ Step = 51; Url = "https://kubernetes.io/docs/concepts/services-networking/service/"; Type = "OFFICIAL"; Topic = "Kubernetes" }
    [PSCustomObject]@{ Step = 52; Url = "https://kubernetes.io/docs/concepts/cluster-administration/networking/"; Type = "ARTICLE"; Topic = "Kubernetes" }
    [PSCustomObject]@{ Step = 53; Url = "https://www.google.com/search?q=Kubernetes+deployment+rolling+update+strategy"; Type = "SEARCH"; Topic = "Kubernetes" }
    [PSCustomObject]@{ Step = 54; Url = "https://stackoverflow.com/questions/tagged/kubernetes?tab=frequent"; Type = "STACK_OVERFLOW"; Topic = "Kubernetes" }
    [PSCustomObject]@{ Step = 55; Url = "https://kubernetes.io/docs/concepts/workloads/controllers/deployment/"; Type = "OFFICIAL"; Topic = "Kubernetes" }

    [PSCustomObject]@{ Step = 56; Url = "https://www.google.com/search?q=Java+concurrency+executors+official+documentation"; Type = "SEARCH"; Topic = "Java concurrency" }
    [PSCustomObject]@{ Step = 57; Url = "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/package-summary.html"; Type = "OFFICIAL"; Topic = "Java concurrency" }
    [PSCustomObject]@{ Step = 58; Url = "https://github.com/openjdk/jdk"; Type = "GITHUB"; Topic = "Java concurrency" }
    [PSCustomObject]@{ Step = 59; Url = "https://stackoverflow.com/questions/tagged/java?tab=frequent"; Type = "STACK_OVERFLOW"; Topic = "Java concurrency" }
    [PSCustomObject]@{ Step = 60; Url = "https://www.baeldung.com/java-executor-service-tutorial"; Type = "ARTICLE"; Topic = "Java concurrency" }
    [PSCustomObject]@{ Step = 61; Url = "https://www.google.com/search?q=Java+CompletableFuture+thread+pool"; Type = "SEARCH"; Topic = "Java concurrency" }
    [PSCustomObject]@{ Step = 62; Url = "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/CompletableFuture.html"; Type = "OFFICIAL"; Topic = "Java concurrency" }
    [PSCustomObject]@{ Step = 63; Url = "https://www.baeldung.com/java-completablefuture"; Type = "ARTICLE"; Topic = "Java concurrency" }
    [PSCustomObject]@{ Step = 64; Url = "https://www.google.com/search?q=Java+volatile+atomic+visibility+happens-before"; Type = "SEARCH"; Topic = "Java concurrency" }
    [PSCustomObject]@{ Step = 65; Url = "https://stackoverflow.com/questions/tagged/java-memory-model"; Type = "STACK_OVERFLOW"; Topic = "Java concurrency" }
    [PSCustomObject]@{ Step = 66; Url = "https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html"; Type = "OFFICIAL"; Topic = "Java concurrency" }

    [PSCustomObject]@{ Step = 67; Url = "https://www.google.com/search?q=Go+goroutines+channels+official+documentation"; Type = "SEARCH"; Topic = "Go concurrency" }
    [PSCustomObject]@{ Step = 68; Url = "https://go.dev/tour/concurrency/1"; Type = "OFFICIAL"; Topic = "Go concurrency" }
    [PSCustomObject]@{ Step = 69; Url = "https://github.com/golang/go"; Type = "GITHUB"; Topic = "Go concurrency" }
    [PSCustomObject]@{ Step = 70; Url = "https://stackoverflow.com/questions/tagged/go-concurrency"; Type = "STACK_OVERFLOW"; Topic = "Go concurrency" }
    [PSCustomObject]@{ Step = 71; Url = "https://go.dev/blog/pipelines"; Type = "ARTICLE"; Topic = "Go concurrency" }
    [PSCustomObject]@{ Step = 72; Url = "https://www.google.com/search?q=Go+context+cancellation+goroutines"; Type = "SEARCH"; Topic = "Go concurrency" }
    [PSCustomObject]@{ Step = 73; Url = "https://pkg.go.dev/context"; Type = "OFFICIAL"; Topic = "Go concurrency" }
    [PSCustomObject]@{ Step = 74; Url = "https://go.dev/blog/context"; Type = "ARTICLE"; Topic = "Go concurrency" }
    [PSCustomObject]@{ Step = 75; Url = "https://www.google.com/search?q=Go+sync+mutex+atomic+memory+model"; Type = "SEARCH"; Topic = "Go concurrency" }
    [PSCustomObject]@{ Step = 76; Url = "https://stackoverflow.com/questions/tagged/go?tab=frequent"; Type = "STACK_OVERFLOW"; Topic = "Go concurrency" }
    [PSCustomObject]@{ Step = 77; Url = "https://go.dev/ref/mem"; Type = "OFFICIAL"; Topic = "Go concurrency" }

    [PSCustomObject]@{ Step = 78; Url = "https://www.google.com/search?q=distributed+systems+consensus+replication+research"; Type = "SEARCH"; Topic = "distributed systems" }
    [PSCustomObject]@{ Step = 79; Url = "https://raft.github.io/"; Type = "OFFICIAL"; Topic = "distributed systems" }
    [PSCustomObject]@{ Step = 80; Url = "https://github.com/etcd-io/etcd"; Type = "GITHUB"; Topic = "distributed systems" }
    [PSCustomObject]@{ Step = 81; Url = "https://stackoverflow.com/questions/tagged/distributed-systems"; Type = "STACK_OVERFLOW"; Topic = "distributed systems" }
    [PSCustomObject]@{ Step = 82; Url = "https://martinfowler.com/articles/patterns-of-distributed-systems/"; Type = "ARTICLE"; Topic = "distributed systems" }
    [PSCustomObject]@{ Step = 83; Url = "https://www.google.com/search?q=distributed+systems+CAP+theorem+availability+partition+tolerance"; Type = "SEARCH"; Topic = "distributed systems" }
    [PSCustomObject]@{ Step = 84; Url = "https://jepsen.io/consistency"; Type = "ARTICLE"; Topic = "distributed systems" }
    [PSCustomObject]@{ Step = 85; Url = "https://github.com/aphyr/jepsen"; Type = "GITHUB"; Topic = "distributed systems" }
    [PSCustomObject]@{ Step = 86; Url = "https://www.google.com/search?q=distributed+systems+exactly+once+delivery"; Type = "SEARCH"; Topic = "distributed systems" }
    [PSCustomObject]@{ Step = 87; Url = "https://stackoverflow.com/questions/tagged/distributed-systems?tab=frequent"; Type = "STACK_OVERFLOW"; Topic = "distributed systems" }
    [PSCustomObject]@{ Step = 88; Url = "https://github.com/google/leveldb"; Type = "GITHUB"; Topic = "distributed systems" }

    [PSCustomObject]@{ Step = 89; Url = "https://www.google.com/search?q=Kafka+consumer+group+rebalance+sticky+assignor"; Type = "SEARCH"; Topic = "Kafka" }
    [PSCustomObject]@{ Step = 90; Url = "https://kafka.apache.org/documentation/#consumerconfigs"; Type = "OFFICIAL"; Topic = "Kafka" }
    [PSCustomObject]@{ Step = 91; Url = "https://github.com/apache/kafka/wiki"; Type = "GITHUB"; Topic = "Kafka" }
    [PSCustomObject]@{ Step = 92; Url = "https://stackoverflow.com/questions/tagged/apache-kafka?sort=votes"; Type = "STACK_OVERFLOW"; Topic = "Kafka" }
)

foreach ($action in $Actions) {
    $index = "[{0}/{1}]" -f $action.Step, $Actions.Count
    Write-Host "$index $($action.Type) | $($action.Topic) | $($action.Url)"
    Start-Process $Browser -ArgumentList $action.Url

    if ($action.Type -eq "SEARCH") {
        Start-Sleep -Seconds ($DelaySeconds + 1)
    } else {
        Start-Sleep -Seconds $DelaySeconds
    }
}

Write-Host "Stress test complete."
Write-Host "Actions executed: $($Actions.Count)"
Write-Host "Pariet session was NOT stopped by this script."
