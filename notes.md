1. We should run all our services inside a same AWS VPC, subnet(optional) and security group(optional) to ensure fast communication b/w them.
    - A private IPv4 address is an IP address that's not reachable over the Internet. 
    - we can use private IPv4 addresses for communication between instances in the same VPC
    - An instance's private IP address will never change during the lifetime of that instance.
    - A subnet is a range of IP addresses(like 172.31.0.1 to 172.31.0.30) in your VPC
    - Resouces in same subnet and VPC reduces network delay communicates faster 
    - An AWS security group acts as a virtual firewall for your EC2 instances to control incoming and outgoing traffic
    - Using Security Group, we can control which services(ec2) you want to allow traffic from other services(ec2 instances) runniing in vpc.
        - To allow service access within VPC, just configure the source as CIDR range of your VPC in security group
        - https://stackoverflow.com/questions/73454923/ec2-open-port-for-only-private-ip-address
        - For Eg, For a service running CRON jobs, we may not need to allow incoming or outgoing traffic
2. Only Gateway Service should be accessible from outside world.
    - Other services will be accessed in within VPC only
3. Client will send the requests to Gateway-Service and then we proxy the requests to respective service inside vpc using their private ip.
4. Load Balancer and Rate Limiter will be setup inside gateway service.
5. For synchronous inter-service communication, services send the requests to gateway service private ip(as gateway-service is inside vpc).
    - services can also send the requests to gateway service external ip/domain(used by clients) but it will increase unnecessary the network delay.
    - https://serverfault.com/questions/227682/whats-best-practice-for-communication-between-amazon-ec2-instances