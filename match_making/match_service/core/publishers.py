from .rabbitmq import APIPub, NotificationPub, RabbitmqBase

apipub = APIPub(host='rabbitmq', port=5672, queue_name="api")
notifspub = NotificationPub(host='rabbitmq', port=5672, queue_name="notifications")

publishers: list[RabbitmqBase] = [apipub, notifspub]
